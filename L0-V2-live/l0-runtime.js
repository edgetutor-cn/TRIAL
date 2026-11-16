(function(){'use strict';
var pack=window.L0_COURSES, id=window.L0_LESSON_ID||new URLSearchParams(location.search).get('lesson'), course=pack&&pack.courses[id], stage=document.getElementById('stage');
var page=0, states={}, muted=false, rewardAudio=null, rewardTimer=null, audioContext=null, rewardCount=0, panel=false, observations={};
function fit(){var scale=Math.min(innerWidth/1280,innerHeight/720);stage.style.transform='scale('+scale+')';}addEventListener('resize',fit);fit();
function el(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x;}
function svgIcon(name){var paths={trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0Zm5 12v5M7 21h10M7 5H3v4a4 4 0 0 0 4 4M17 5h4v4a4 4 0 0 1-4 4"/>',thumb:'<path d="M8 10 12 3c3 0 2 5 2 6h5c2 0 2 1 1 4l-2 7H8ZM3 10h5v11H3Z"/>',left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',replay:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',book:'<path d="M12 5C8 2 3 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-1-1-6-2-10 1Zm0 0v16"/>',music:'<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>',mute:'<path d="M9 18V5l12-2v13M3 3l18 18"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>',star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>'};return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.replay)+'</svg>';}
function button(text,fn,cls){var b=el('button',cls||'',text);b.type='button';b.addEventListener('click',fn);var map={'Again':'replay','Play again':'replay','Next round':'right','Next moment':'right','Tell it again':'replay','Next turn':'right','Your turn again':'replay','Start again':'replay','Close the curtains':'close','Play / Pause':'play','Replay':'replay','Retry song':'replay'};if(map[text]){var t=b.textContent;b.textContent='';b.innerHTML=svgIcon(map[text]);b.classList.add('icon-control');b.setAttribute('aria-label',t);b.title=t;}return b;}
function iconButton(label,icon,fn,cls){var b=button('',fn,cls||'quiet-icon');b.innerHTML=svgIcon(icon);b.setAttribute('aria-label',label);b.title=label;return b;}
function mediaUrl(path){return(window.L0_EMBED&&window.L0_EMBED[path])||path;}
// [1116 live-preload v2] fetch every picture and cheer sound of this lesson up front
// (assetMap art + core-library word cards + song page + shared scenes), so page turns
// render instantly instead of waiting for per-page downloads.
(function(){function pre(p){var a=/\.(mp3)$/i.test(p);var e=a?new Audio():new Image();if(a)e.preload="auto";e.src=mediaUrl(p);}var pl=[];try{if(course&&course.assetMap){for(var k in course.assetMap){var v=course.assetMap[k];if(/\.(webp|png|jpg|mp3)$/i.test(v)&&pl.indexOf(v)<0)pl.push(v);}}}catch(e){}try{if(course&&course.words&&course.words.length){var d=course.imageDir||"core-library/U01/";course.words.forEach(function(w){var p=d+w+".webp";if(pl.indexOf(p)<0)pl.push(p);});}}catch(e){}["assets/goodbye.jpg","assets/one-little-finger.jpg","assets/playroom.webp","assets/nose-mouth.webp","assets/amazing.mp3","assets/excellent.mp3","assets/good.mp3","assets/highfive.mp3"].forEach(function(x){if(pl.indexOf(x)<0)pl.push(x);});pl.forEach(pre);})();
// Character poses and shared scene art live in assets/; target word pictures live in the unit's own core-library folder.
function pic(name,cls){var common=/^(jojo|mimi)-/.test(name)||/^(playroom|nose-story|mirror-story|theatre-curtain|theatre-open|body-atlas|characters-atlas)$/.test(name);var x=el('img',cls);x.src=mediaUrl((course&&course.assetMap&&course.assetMap[name])||((common?'assets/':((course&&course.imageDir)||'assets/'))+name+'.webp'));x.alt=name.replace(/-/g,' ');x.draggable=false;return x;}
function fresh(){return{round:0,selected:null,done:false,revealed:{},marked:{},gifts:{},hidden:false,recalled:false,message:''};}
function state(){return states[page]||(states[page]=fresh());}
function stopMedia(){document.querySelectorAll('video,audio').forEach(function(x){x.pause();});if(rewardAudio){rewardAudio.pause();rewardAudio.currentTime=0;}}
function clearReward(){clearTimeout(rewardTimer);var r=document.getElementById('reward');if(r)r.remove();if(rewardAudio){rewardAudio.pause();rewardAudio.currentTime=0;}}
function tone(){if(muted)return;try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioContext=audioContext||new AC();audioContext.resume();var o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.frequency.setValueAtTime(660,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(990,audioContext.currentTime+.13);g.gain.setValueAtTime(.06,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.3);o.start();o.stop(audioContext.currentTime+.31);}catch(e){}}
function bounce(x){if(!x)return;x.classList.remove('soft-bounce');void x.offsetWidth;x.classList.add('soft-bounce');}
// B05: wrong / media-failure feedback must be visible, never silent.
function feedback(text){state().message=text;var old=document.getElementById('toast');if(old)old.remove();if(!text)return;var t=el('div','feedback-toast',text);t.id='toast';stage.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},1400);}
function reward(key,label){var quick=document.getElementById('quick-cheers');if(quick)quick.remove();clearReward();stopMedia();rewardCount++;var layer=el('div','stars reward-'+key);layer.id='reward';var colors=['#ff6587','#ffcc32','#48bfdb','#9c82ec','#73cc92','#ff975c'];var icon=key==='excellent'?'star':key==='amazing'?'trophy':'thumb';for(var i=0;i<(key==='good'?36:24);i++){var b=el('i',key==='good'?'balloon':'reward-symbol');if(key!=='good')b.innerHTML=svgIcon(icon);b.style.setProperty('--c',colors[i%6]);b.style.setProperty('--x',(2+(i*17)%95)+'%');b.style.setProperty('--delay',((i%9)*.11)+'s');layer.appendChild(b);}layer.appendChild(el('div','celebrate-text',label));layer.appendChild(button('Close celebration',clearReward,'small'));stage.appendChild(layer);rewardAudio=new Audio(mediaUrl('assets/'+key+'.mp3'));rewardAudio.muted=muted;rewardAudio.volume=.7;rewardAudio.play().catch(function(){feedback('Sound unavailable. You can keep teaching.');});rewardTimer=setTimeout(clearReward,7000);}
function setMute(){muted=!muted;document.querySelectorAll('video,audio').forEach(function(x){x.muted=muted;});if(rewardAudio)rewardAudio.muted=muted;document.getElementById('mute').innerHTML=svgIcon(muted?'mute':'music');document.getElementById('mute').setAttribute('aria-label',muted?'Unmute all sounds':'Mute all sounds');}
function go(n){clearReward();stopMedia();panel=false;page=Math.max(0,Math.min(course.pages.length-1,n));if(course.pages[page].type==='notes')page=findType('choice');render();}
function findType(t){for(var i=0;i<course.pages.length;i++)if(course.pages[i].type===t)return i;return -1;}
function goodbye(){var g=findType('goodbye');return g<0?course.pages.length-1:g;}
function firstOptional(){for(var i=0;i<course.pages.length;i++)if(course.pages[i].optional)return i;return -1;}
function next(){if(page===goodbye())return;var p=course.pages[page];if(p.type==='choice'){go(goodbye());return;}if(p.optional&&(page===course.pages.length-1||!course.pages[page+1].optional)){go(goodbye());return;}if(page===course.pages.length-1){go(goodbye());return;}var n=page+1;if(course.pages[n]&&course.pages[n].type==='notes')n++;go(Math.min(n,course.pages.length-1));}
function row(){return el('div','row');}
// v2.4: large colour words and a teacher-model sentence next to every target picture.
function wordInfo(w){var s=(course&&course.sentences)||{},col=(course&&course.wordColors)||{};return{sentence:s[w]||('Look! '+w+'.'),color:col[w]||'#16438e'};}
function wordLabel(w){var e=el('span','learning-word',w);e.style.color=wordInfo(w).color;return e;}
function learningLine(w,custom){var s=custom||wordInfo(w).sentence,i=s.toLowerCase().indexOf(String(w).toLowerCase()),e=el('div','learning-sentence');if(i<0){e.textContent=s;return e;}e.appendChild(document.createTextNode(s.slice(0,i)));e.appendChild(wordLabel(s.slice(i,i+String(w).length)));e.appendChild(document.createTextNode(s.slice(i+String(w).length)));return e;}
// B08: model card is a static display, never a clickable control.
function card(word,fn,cls,staticDisplay){var b=staticDisplay?el('div','card static '+(cls||'')):button('',fn,'card '+(cls||''));if(!staticDisplay){b.setAttribute('aria-label',word);}b.dataset.word=word;b.appendChild(pic(word));b.appendChild(wordLabel(word));return b;}
function pairFor(p,s){var words=p.words||course.words;if(words.length>2){var k=Math.floor(s.round/2)%Math.ceil(words.length/2);return words.slice(k*2,k*2+2);}return words;}
function targetFor(p,s){var pair=pairFor(p,s);return pair[s.round%pair.length];}
// B06: round-level temporary state is separate from any whole-lesson collection.
function roundControls(c,p,s,max){max=Math.max(max,(p.words||course.words).length);var actions=row();actions.appendChild(button('Again',function(){states[page]=fresh();render();},'small'));actions.appendChild(button(s.round>=max-1?'Play again':'Next round',function(){var nr=(s.round+1)%Math.max(max,(p.words||course.words).length);states[page]=fresh();s=state();s.round=nr;s.gifts={};render();},'small'));c.appendChild(actions);}
function goal(c,p,s){
  // 06: show the core teacher-model sentence big on every judging/transfer page,
  // not hidden in the teacher panel. Highlights the current target word.
  var w=targetFor(p,s);
  var sen=(course&&course.sentences&&course.sentences[w])||('Look! '+w+'.');
  var wrap=el('div','goal-sentence');
  wrap.appendChild(learningLine(w,sen));
  c.appendChild(wrap);
}
function intendedCue(p,s){return targetFor(p,s);}
// B02: closed judging pages all read the same target the program uses; the teacher panel shows it.
function choose(c,p,s){var pair=pairFor(p,s),target=targetFor(p,s);goal(c,p,s);var r=row(),choices=pair.slice();if(s.round%2===0)choices.reverse();choices.forEach(function(w){var b=card(w,function(){if(p.open||w===target){s.done=true;tone();b.classList.add('completed');feedback(p.type==='mission'?'You helped our friends!':'You found it!');}else{bounce(b);feedback('Let’s try together.');}});r.appendChild(b);});c.appendChild(r);roundControls(c,p,s,4);}
function theatreTile(w,covered,fn,cls){var b=button('',fn,'theatre-tile '+(cls||'')+(covered?' closed':' opened'));b.setAttribute('aria-label',(covered?'Open curtain for ':'Picture of ')+w);var stageBox=el('div','theatre-stage');stageBox.appendChild(pic('theatre-open','theatre-frame'));var inner=el('span','theatre-picture');inner.appendChild(pic(w));stageBox.appendChild(inner);stageBox.appendChild(pic('theatre-curtain','theatre-curtain'));b.appendChild(stageBox);var lbl=el('div','theatre-word');lbl.appendChild(wordLabel(w));b.appendChild(lbl);return b;}
function reveal(c,p,s){var r=row(),pair=pairFor(p,s);pair.forEach(function(w){var covered=!s.revealed[w];r.appendChild(theatreTile(w,covered,function(){if(!s.revealed[w]){s.revealed[w]=true;tone();render();}}));});c.appendChild(r);c.appendChild(button('Close the curtains',function(){s.revealed={};render();},'small'));if((p.words||course.words).length>2)roundControls(c,p,s,(p.words||course.words).length);}
// B03: with one static illustration we do NOT fake scene changes. The picture stays;
// a visible story line progresses and the child points to the target in the picture.
function story(c,p,s){var words=p.words||course.words,w=words[s.round%words.length];var scene=el('div','story-focus');scene.style.backgroundImage="url('"+mediaUrl('assets/unit-bg-U'+('0'+course.unit).slice(-2)+'.webp')+"')";scene.appendChild(pic(s.round%2?'mimi-neutral':'jojo-neutral','story-friend'));var target=el('div','story-target');target.appendChild(pic(w));target.appendChild(wordLabel(w));scene.appendChild(target);c.appendChild(scene);c.appendChild(learningLine(w));var actions=row();actions.appendChild(button('Next moment',function(){s.round=(s.round+1)%words.length;render();},'small'));c.appendChild(actions);}
// B04: routine turns are visible — a different friend leads each turn and the focus word changes.
function routine(c,p,s){var at=s.round%3,lay=row();lay.classList.add('routine-layout');lay.appendChild(pic(at===1?'mimi-wave':'jojo-wave','character'));var middle=el('div','routine-learning');if(p.hello){middle.appendChild(el('div','hello-model',at===0?'Hello, Jojo!':at===1?'Hello, Mimi!':'Hello!'));}else{var turn=p.turns&&p.turns[at],ws=p.focusList||[p.focus||(p.words||course.words)[0]],w=turn?turn.word:ws[0],sen=turn?turn.sentence:p.languageSentence;var pics=el('div','routine-pics');pics.appendChild(pic(w,'routine-target'));middle.appendChild(pics);middle.appendChild(el('div','routine-turn',at===0?'Watch me.':at===1?'Together.':'Your turn.'));middle.appendChild(wordLabel(w));middle.appendChild(learningLine(w,sen));}lay.appendChild(middle);lay.appendChild(pic(at===1?'jojo-neutral':'mimi-neutral','character'));c.appendChild(lay);var controls=row();controls.appendChild(button('Start again',function(){s.round=0;render();},'small'));controls.appendChild(button('Next turn',function(){s.round=(s.round+1)%3;render();},'small'));c.appendChild(controls);}
function memory(c,p,s){var pair=pairFor(p,s),missing=pair[s.round%pair.length],top=row();top.classList.add('memory-display');pair.forEach(function(w){var hide=s.hidden&&!s.recalled&&w===missing;top.appendChild(theatreTile(w,hide,function(){if(hide){s.hidden=false;render();}},'mini'));});c.appendChild(top);if(s.hidden){var choices=row();choices.classList.add('memory-choices');pair.slice().reverse().forEach(function(w){choices.appendChild(card(w,function(){if(w===missing){s.recalled=true;tone();render();feedback('Our picture is back!');}else{bounce(w&&choices.children[pair.indexOf(w)]);feedback('Let’s look and try together.');}}));});c.appendChild(choices);}var actions=row();actions.appendChild(button(s.hidden?'Show both pictures':'Tuck one picture away',function(){s.hidden=!s.hidden;s.recalled=false;render();},'small'));actions.appendChild(button('Next hiding place',function(){s.round=(s.round+1)%4;s.hidden=false;s.recalled=false;render();},'small'));c.appendChild(actions);}
function album(c,p,s){var pair=pairFor(p,s),lay=row();lay.classList.add('album-layout');var source=el('div','album-source');pair.forEach(function(w){var b=card(w,function(){s.selected=w;render();},s.selected===w?'selected':'');b.draggable=true;b.addEventListener('dragstart',function(e){s.selected=w;e.dataTransfer.setData('text/plain',w);});source.appendChild(b);});lay.appendChild(source);var book=el('div','storybook'),spread=row();pair.forEach(function(w){function place(){if(!s.selected){feedback('Choose a picture for the book.');return;}if(s.selected===w){s.marked[w]=true;s.selected=null;tone();render();feedback('A little page for our friends!');}else feedback('Try the other page.');}var slot=button('',place,'book-slot '+(s.marked[w]?'filled':''));slot.setAttribute('aria-label','Place picture of '+w);slot.addEventListener('dragover',function(e){e.preventDefault();});slot.addEventListener('drop',function(e){e.preventDefault();var picked=e.dataTransfer.getData('text/plain');if(pair.indexOf(picked)>=0)s.selected=picked;place();});slot.appendChild(pic(w));spread.appendChild(slot);});book.appendChild(spread);book.appendChild(pic('jojo-wave','book-friend'));lay.appendChild(book);lay.appendChild(pic('mimi-wave','album-friend'));c.appendChild(lay);roundControls(c,p,s,4);}
function shadow(c,p,s){var pair=pairFor(p,s),r=row();pair.forEach(function(w){var b=card(w,function(){s.selected=w;render();},s.selected===w?'selected':'');b.draggable=true;b.addEventListener('dragstart',function(e){s.selected=w;e.dataTransfer.setData('text/plain',w);});r.appendChild(b);});c.appendChild(r);var d=row();pair.slice().reverse().forEach(function(w){var done=s.marked[w];var b=card(w,function(){place(w);},'shadow '+(done?'done':''));b.setAttribute('aria-label','Shadow for '+w);b.addEventListener('dragover',function(e){e.preventDefault();});b.addEventListener('drop',function(e){e.preventDefault();var picked=e.dataTransfer.getData('text/plain');if(pair.indexOf(picked)>=0)s.selected=picked;place(w);});d.appendChild(b);});function place(w){if(!s.selected){feedback('Choose a picture first.');return;}if(s.selected===w){s.marked[w]=true;s.selected=null;tone();render();feedback('A lovely match!');}else{s.selected=null;render();feedback('Try the other shadow.');}}c.appendChild(d);roundControls(c,p,s,4);}
function claw(c,p,s){goal(c,p,s);var machine=el('div','claw-machine');var head=el('div','claw-head');head.innerHTML='<svg viewBox="0 0 70 70" width="65" height="65" fill="none" stroke="#486c7d" stroke-width="7" stroke-linecap="round"><path d="M35 0v22M35 22 12 40l5 20M35 22l23 18-5 20M35 22v35"/></svg>';machine.appendChild(head);var r=row();pairFor(p,s).forEach(function(w){r.appendChild(card(w,function(){s.selected=w;render();},(s.selected===w?'selected ':'')+(s.done&&s.selected===w?'caught':'')));});machine.appendChild(r);c.appendChild(machine);c.appendChild(button('Grab!',function(){if(!s.selected){feedback('Choose a picture first.');return;}if(s.busy)return;s.busy=true;machine.querySelector('.claw-head').style.left=(s.selected===pairFor(p,s)[0]?'28%':'64%');machine.classList.add('grabbing');var at=page;setTimeout(function(){s.busy=false;if(page!==at)return;if(p.open||s.selected===targetFor(p,s)){s.done=true;tone();}else{s.done=false;}render();feedback(s.done?'Here is your surprise!':'Let’s find the other picture.');},750);},'primary'));roundControls(c,p,s,4);}
// Face hotspots are only valid for the two already-verified nose/mouth coordinates; every other pair gives a picture to a friend.
function faceMode(p){var w=p.words||course.words;return course.unit===1&&w.length===2&&w.every(function(x){return x==='nose'||x==='mouth';});}
// B01: single safe area; explicit two-row grid, friend+small gift on one row, word cards on the next.
function faces(c,p,s){goal(c,p,s);if(faceMode(p))return faceHotspots(c,p,s);var pair=pairFor(p,s),grid=el('div','face-grid'),rowTop=el('div','face-row'),rowCards=el('div','face-cards');['jojo','mimi'].forEach(function(name){var f=el('div','friend-wrap');f.appendChild(pic(name+'-neutral','character'));var gift=el('div','friend-gift');if(s.gifts[name])gift.appendChild(pic(s.gifts[name]));f.appendChild(gift);rowTop.appendChild(f);});grid.appendChild(rowTop);pair.forEach(function(w){rowCards.appendChild(card(w,function(){if(p.open||w===targetFor(p,s)){var who=s.round%2===0?'jojo':'mimi';s.gifts[who]=w;tone();render();feedback('A picture for '+who+'!');}else{bounce(cardEl(w));feedback('Let’s point together.');}}));});grid.appendChild(rowCards);c.appendChild(grid);roundControls(c,p,s,4);function cardEl(w){return rowCards.querySelector('[data-word="'+w+'"]');}}
function faceHotspots(c,p,s){
  // 04/05: direct-pointing art. Jojo (left) points to nose, Mimi (right) points to mouth;
  // each label sits under the matching action, never cross-wired.
  var wrap=el('div','face-direct');
  var art=el('img','face-direct-art');
  art.src=mediaUrl('assets/nose-mouth.webp');
  art.alt='Jojo points to his nose and Mimi points to her mouth';
  wrap.appendChild(art);
  [['nose',33,38],['mouth',66,43]].forEach(function(d){
    var w=d[0];
    var b=button(w,function(){if(p.open||w===targetFor(p,s)){s.marked[w]=true;tone();feedback('You found it!');render();}else feedback('Let’s point together.');},'hotspot direct-'+w+(s.marked[w]?' marked':''));
    b.style.left=d[1]+'%';b.style.top=d[2]+'%';
    b.setAttribute('aria-label',w);
    wrap.appendChild(b);
  });
  c.appendChild(wrap);roundControls(c,p,s,4);
}
// B07: scene = drop a chosen picture into the target slot; puppet = the friend performs the action (imitation prompt).
function act(c,p,s,mode){goal(c,p,s);var pair=pairFor(p,s);if(mode==='scene'){var board=el('div','act-board scene');board.appendChild(pic('jojo-wave','character'));var slot=el('div','scene-slot');slot.setAttribute('aria-label','Drop the picture here');if(s.placed)slot.appendChild(pic(s.placed));board.appendChild(slot);board.appendChild(pic('mimi-wave','character'));c.appendChild(board);var r=row();pair.forEach(function(w){r.appendChild(card(w,function(){if(p.open||w===targetFor(p,s)){s.placed=w;tone();feedback('It goes into the basket!');render();}else{bounce(cardEl(w));feedback('Let’s try together.');}},s.placed===w?'selected':''));});c.appendChild(r);roundControls(c,p,s,4);function cardEl(w){return r.querySelector('[data-word="'+w+'"]');}}
else{var stage2=el('div','act-board puppet');stage2.appendChild(pic('jojo-wave','character'));var show=el('div','puppet-show');if(s.placed){show.appendChild(el('div','puppet-label','Jojo is '+s.placed+'ing!'));show.appendChild(pic(s.placed));}else show.appendChild(el('div','puppet-label','Choose a picture — Jojo will try it!'));stage2.appendChild(show);stage2.appendChild(pic('mimi-wave','character'));c.appendChild(stage2);var r2=row();pair.forEach(function(w){r2.appendChild(card(w,function(){if(p.open||w===targetFor(p,s)){s.placed=w;tone();feedback('Jojo tries '+w+'!');render();}else{bounce(cardEl2(w));feedback('Let’s try together.');}},s.placed===w?'selected':''));});c.appendChild(r2);roundControls(c,p,s,4);function cardEl2(w){return r2.querySelector('[data-word="'+w+'"]');}}}

function spotlight(c,p,s){goal(c,p,s);var w=targetFor(p,s),tile=el('div','spotlight-window'+(s.revealed[w]?' lit':''));tile.appendChild(pic(w));c.appendChild(tile);c.appendChild(button(s.revealed[w]?'Hide picture':'Shine the light',function(){s.revealed[w]=!s.revealed[w];tone();render();},'primary'));if(s.revealed[w])c.appendChild(wordLabel(w));roundControls(c,p,s,Math.max(4,(p.words||course.words).length));}
function wheel(c,p,s){var pair=pairFor(p,s),disk=el('div','picture-wheel'),spinning=!!s.busy;pair.forEach(function(w){var tile=el('div','wheel-target');tile.appendChild(pic(w));tile.appendChild(wordLabel(w));disk.appendChild(tile);});disk.style.transform='rotate('+(s.spin||0)+'deg)';c.appendChild(disk);var result=el('div','wheel-result');if(s.winner)result.appendChild(learningLine(s.winner));c.appendChild(result);var b=button('Spin!',function(){if(s.busy)return;s.busy=true;var at=page,w=pair[s.round%pair.length];var wanted=s.round%2?0:180;s.spin=(s.spin||0)+720+((wanted-(s.spin||0)%360+360)%360);disk.style.transform='rotate('+s.spin+'deg)';setTimeout(function(){s.busy=false;if(page!==at)return;s.winner=w;s.round++;tone();render();},900);},'primary');b.disabled=spinning;c.appendChild(b);c.appendChild(button('Start again',function(){states[page]=fresh();render();},'small'));}
function whack(c,p,s){goal(c,p,s);var pair=pairFor(p,s),holes=el('div','pop-holes');pair.forEach(function(w){var b=card(w,function(){if(p.open||w===targetFor(p,s)){s.marked[w]=true;tone();render();feedback('Pop! You found it!');}else{bounce(b);feedback('Try the other picture.');}},'pop-hole '+(s.marked[w]?'popped':''));if(s.marked[w])b.disabled=true;holes.appendChild(b);});c.appendChild(holes);roundControls(c,p,s,Math.max(4,(p.words||course.words).length));}

function achievement(c,p,s){var hero=el('div','achievement-message');hero.innerHTML=svgIcon('star');hero.appendChild(el('span','','Great job! You listened and tried!'));c.appendChild(hero);var ws=p.words||course.words,k=(s.round%Math.ceil(ws.length/2))*2,pair=ws.slice(k,k+2),r=row();r.classList.add('achievement-cards');pair.forEach(function(w){var tile=el('div','achievement-card');tile.appendChild(pic(w));tile.appendChild(wordLabel(w));tile.appendChild(learningLine(w));r.appendChild(tile);});c.appendChild(r);if(ws.length>2)c.appendChild(button('Next pictures',function(){s.round=(s.round+1)%Math.ceil(ws.length/2);render();},'small'));}

function media(c,closing){var path=closing?'assets/goodbye.mp4':(course.songPath||'assets/one-little-finger.mp4');var isAudio=/\.(mp3|m4a|wav)$/.test(path);var v=el(isAudio?'audio':'video');v.controls=false;v.playsInline=true;v.preload='none';v.muted=muted;v.src=mediaUrl(path);if(!isAudio){var poster=closing?'assets/goodbye.jpg':(course.songPoster||(!course.songPath?'assets/one-little-finger.jpg':null));if(poster)v.poster=mediaUrl(poster);}else{var friends=row();friends.classList.add('song-friends');friends.appendChild(pic('jojo-wave','character'));friends.appendChild(el('p','subtitle',course.songTitle||'Our unit song'));friends.appendChild(pic('mimi-wave','character'));c.appendChild(friends);}v.setAttribute('aria-label',closing?'Goodbye song':'Unit '+course.unit+' song');v.addEventListener('error',function(){feedback('The song could not load.');});v.addEventListener('play',function(){clearReward();});c.appendChild(v);var r=row();r.appendChild(button('Play / Pause',function(){if(v.paused){v.play().catch(function(){feedback('Tap play on the video, or try again.');});}else v.pause();},'small'));r.appendChild(button('Replay',function(){v.currentTime=0;v.play().catch(function(){});},'small'));r.appendChild(button('Retry song',function(){v.load();v.play().catch(function(){feedback('You can continue without the song.');});},'small'));if(!closing)r.appendChild(button('Continue lesson',next,'small'));c.appendChild(r);}
function showNotes(){if(panel)return;stopMedia();panel=true;var p=course.pages[page],n=el('aside','notes-panel');n.id='notes';n.appendChild(button('Close',function(){n.remove();panel=false;},'small close'));n.appendChild(el('h2','','Teacher guide'));var cheers=el('div','teacher-cheers');[['good','Good job!'],['excellent','Excellent!'],['amazing','Amazing!'],['highfive','High five!']].forEach(function(a){cheers.appendChild(button(a[1],function(){n.remove();panel=false;reward(a[0],a[1]);},'small'));});n.appendChild(cheers);n.appendChild(el('p','',p.tip));if(p.type==='workshop'&&p.words)n.appendChild(el('p','','Current cue: '+p.words[(current.round||0)%p.words.length]));if(p.type==='book'&&p.kind==='listen')n.appendChild(el('p','','Current spoken cue: '+p.words[(current.round||0)%p.words.length]));if(p.languageWord)n.appendChild(el('p','','Extension word: '+p.languageWord+' · Model: '+(p.languageSentence||'')));if(p.extensionSentence)n.appendChild(el('p','','Combined model: '+p.extensionSentence));var current=state();var judging=['choose','mission','claw','scene','puppet','face'].indexOf(p.type)>=0;if(judging&&p.words){n.appendChild(el('p','', 'Current cue: '+targetFor(p,current)));n.appendChild(el('p','', 'Expected answer: '+targetFor(p,current)+(p.open?' (accept either picture)':'')));}else if(p.words){n.appendChild(el('p','', 'Current pictures: '+pairFor(p,current).join(', ')));}if(current.message)n.appendChild(el('p','', 'Last interaction: '+current.message));if(p.beats)n.appendChild(el('p','', 'Story line: '+p.beats[current.round%p.beats.length]));if(p.steps)n.appendChild(el('p','', 'Current turn: '+p.steps[current.round%p.steps.length]));n.appendChild(el('p','', '25-minute teaching plan · Suggested here: '+(p.minutes||0)+' min · Teacher controls the pace.'));var total=0;course.pages.forEach(function(x){if(!x.optional&&x.type!=='notes')total+=x.minutes||0;});var schedule=el('details');schedule.appendChild(el('summary','','View the full 25-minute plan ('+total+' min core)'));course.pages.forEach(function(x,i){if(!x.optional&&x.type!=='notes')schedule.appendChild(el('p','',String(i+1)+'. ['+(x.phase||'')+'] '+x.title+' · '+(x.minutes||0)+' min · '+x.tip));});n.appendChild(schedule);n.appendChild(el('p','', 'Listen → model → point or gesture → one word if ready. No reading or writing is required.'));n.appendChild(el('h2','','Observed responses'));var table=el('table');course.words.forEach(function(w){var tr=el('tr'),td=el('td','',w),cell=el('td'),select=el('select');select.setAttribute('aria-label','Observation for '+w);['Not observed','With support','Independently'].forEach(function(t){var o=el('option','',t);o.value=t;select.appendChild(o);});select.value=observations[w]||'Not observed';select.addEventListener('change',function(){observations[w]=select.value;});cell.appendChild(select);tr.appendChild(td);tr.appendChild(cell);table.appendChild(tr);});n.appendChild(table);stage.appendChild(n);}
function openCheers(){var prior=document.getElementById('quick-cheers');if(prior){prior.remove();return;}var menu=el('div','quick-cheers');menu.id='quick-cheers';[['good','Good job!'],['excellent','Excellent!'],['amazing','Amazing!'],['highfive','High five!']].forEach(function(a){menu.appendChild(button(a[1],function(){menu.remove();reward(a[0],a[1]);},'small'));});stage.appendChild(menu);}
function showChapters(){var old=document.getElementById('chapters');if(old){old.remove();return;}var n=el('aside','u1-chapters');n.id='chapters';n.appendChild(button('Close',function(){n.remove();},'small'));course.pages.forEach(function(p,i){var b=button((i+1)+'. '+p.title,function(){go(i);},'small');n.appendChild(b);});stage.appendChild(n);}
function studentTitle(p){if(p.type==='book')return p.kind==='cover'?'':p.title;if(p.type==='workshop')return p.title;if(p.type==='summary')return 'We learned!';if(p.type==='cover')return 'Today we learn!';if(p.type==='routine'&&p.hello)return 'Say hello!';if(p.type==='goodbye')return 'Goodbye!';if(p.type==='song')return 'Sing and move!';if(p.type==='choose'||p.type==='mission'||p.type==='claw')return 'Listen.';if(p.type==='shadow')return 'Match.';return '';}
// U01: meaning, action, recall and communication. Teacher operated; no speech scoring.
function storybook(c,p,s){
 var root=el('div','book-page book-'+p.kind);
 var words=p.words||course.words;
 var turn=(s.round||0)%(p.lines?p.lines.length:2);
 var wi=(s.round||0)%words.length;
 var w=words[wi];
 stage.setAttribute('data-book-kind',p.kind);stage.setAttribute('data-book-tone',p.tone||'mint');
 c.appendChild(root);
 function image(name,cl){return pic(name,cl||'');}
 function rainbow(text,cls){var a=el('div','rainbow '+(cls||''));a.setAttribute('role','img');a.setAttribute('aria-label',text);Array.from(text).forEach(function(ch,i){var t=el('span','',ch===' '?'\u00a0':ch);t.setAttribute('aria-hidden','true');t.style.color=['#ef577d','#14a8a4','#f9b93f','#7775d5','#45a9d6'][i%5];a.appendChild(t);});return a;}
 var WORDS_RE=null;
 function wordRe(){if(!WORDS_RE){var ws=(course.words||[]).concat(course.extensionWords||['finger','toes']).concat(['smile']);WORDS_RE='('+ws.join('|')+')';}return WORDS_RE;}
 function model(text,cls){var a=el('div','book-model '+(cls||''));var src=wordRe();var split=new RegExp(src,'g');var test=new RegExp('^'+src+'$');text.split(split).forEach(function(t){a.appendChild(el('span',test.test(t)?'em-word':'',t));});return a;}
 function actions(items){var a=el('div','book-actions');items.forEach(function(x){a.appendChild(button(x[0],x[1],'book-control'));});root.appendChild(a);}
 function reset(){states[page]=fresh();render();}
 function advance(){states[page]=fresh();state().round=(s.round||0)+1;render();}
 function background(key){var a=image(key,'book-backdrop');root.appendChild(a);}
 function artFor(word,fallback){return (p.artOverride&&p.artOverride[word])||fallback;}
 function tile(word,fn,cl){var a=fn?button('',fn,'book-card '+(cl||'')):el('div','book-card '+(cl||''));a.dataset.word=word;a.appendChild(image(word,'book-card-art'));a.appendChild(rainbow(word));return a;}
 function stars(){var a=el('div','book-stars','★  ★  ★');a.setAttribute('aria-hidden','true');root.appendChild(a);}
 if(p.kind==='cover'){
  background(p.art||'art-A01_unit_mirror_world');var card=el('div','book-cover-copy');card.appendChild(el('div','book-level',p.levelLine||('LEVEL 0 · UNIT 1 · LESSON '+course.lesson)));card.appendChild(rainbow(p.coverTitle||course.title,'book-cover-title'));var chips=el('div','book-word-chips');chips.setAttribute('data-count',words.length);words.forEach(function(x){chips.appendChild(rainbow(x));});card.appendChild(chips);card.appendChild(model(p.coverModel||course.primaryModel));root.appendChild(card);root.appendChild(button('Let\u2019s begin!',function(){go(page+1);},'book-begin'));
 }else if(p.kind==='scene'||p.kind==='hello'||p.kind==='act'||p.kind==='talk'||p.kind==='chant'){
  var sceneArt=p.art, cue=Array.isArray(p.lines[turn])?p.lines[turn].join(' '):p.lines[turn];
  if(p.kind==='talk'||p.kind==='act'){for(var qi=0;qi<words.length;qi++){if(cue.indexOf(words[qi])>=0){sceneArt=artFor(words[qi],'art-C_'+words[qi]+'_scene');break;}}}
  background(sceneArt);var bubble=el('div','book-speech');
  var text=p.lines[turn];if(Array.isArray(text)){bubble.appendChild(model(text[0]));if(s.done)bubble.appendChild(model(text[1],'book-reply'));}
  else bubble.appendChild(model(s.hidden?'Your turn!':text));
  root.appendChild(bubble);
  if(p.kind==='talk')actions([[s.done?'Hide reply':'Show reply',function(){s.done=!s.done;render();}],['Next turn',advance],['Start again',reset]]);
  else if(p.kind==='act')actions([[s.hidden?'Show action':'Your turn',function(){s.hidden=!s.hidden;render();}],['Next action',advance],['Start again',reset]]);
  else actions([['Next moment',advance],['Start again',reset]]);
 }else if(p.kind==='word'){
  background(p.art);var word=el('div','book-word-cloud');word.appendChild(rainbow(p.word,'book-large-word'));word.appendChild(model(p.sentence));root.appendChild(word);
 }else if(p.kind==='listen'){
  var lw=(p.words||course.words);var field=el('div','bubble-field');field.setAttribute('data-count',lw.length);
  lw.forEach(function(x,i){var b=tile(x,function(){if(x===w){s.selected=x;render();feedback('You found it!');}else{bounce(b);feedback('Listen once more.');}},'bubble '+(s.selected===x?'chosen':''));b.style.setProperty('--tilt',i%2?'4deg':'-4deg');field.appendChild(b);});root.appendChild(field);
  var line=model(s.selected?course.sentences[s.selected]:'Listen and point.','book-bottom-model');root.appendChild(line);stars();actions([['Show picture',function(){s.selected=w;render();}],['Next turn',advance],['Start again',reset]]);
 }else if(p.kind==='peek'){
  var frame=el('div','magic-mirror');frame.appendChild(image(artFor(w,'art-B_'+w+'_card'),'mirror-picture'));
  for(var i=0;i<6;i++){(function(k){var cover=button('',function(){s.revealed[k]=true;render();},'mirror-piece '+(s.revealed[k]?'lifted':''));cover.style.left=(k%3)*33.333+'%';cover.style.top=Math.floor(k/3)*50+'%';cover.setAttribute('aria-label','Reveal mirror piece '+(k+1));cover.appendChild(el('span','','✦'));frame.appendChild(cover);})(i);}root.appendChild(frame);
  root.appendChild(model(s.done?course.sentences[w]:'What can you see?','book-bottom-model'));
  actions([['Open the mirror',function(){for(var k=0;k<6;k++)s.revealed[k]=true;s.done=true;render();}],['Next picture',advance],['Start again',reset]]);
 }else if(p.kind==='memory'){
  var field=el('div','bubble-field');field.setAttribute('data-count',words.length);words.forEach(function(x,i){var a=tile(x,null,'bubble '+(s.hidden&&!s.done&&i===wi?'asleep':''));field.appendChild(a);});root.appendChild(field);
  root.appendChild(model(s.done?course.sentences[w]:(s.hidden?'What is missing?':'Look carefully!'),'book-bottom-model'));
  actions([['Hide one',function(){s.hidden=true;s.done=false;render();}],['Show answer',function(){s.done=true;render();}],['Next turn',advance],['Start again',reset]]);
 }else if(p.kind==='silly'){
  background(p.art||'art-C_nose_scene');var bubble=el('div','book-speech');bubble.appendChild(model(s.done?p.fix:p.say));if(!s.done)bubble.appendChild(el('div','oops-tag',p.tag||'Oops, Jojo!'));root.appendChild(bubble);
  actions([[s.done?'Try again':'Help Jojo',function(){s.done=!s.done;render();}],['Start again',reset]]);
 }else if(p.kind==='parade'){
  var plist=p.words||course.words;var pw=plist[(s.round||0)%plist.length];
  background(p.art||'art-A02_unit_mirror_wide');
  var spot=el('div','parade-spot');var card=el('div','book-card parade-card');
  card.appendChild(image(artFor(pw,'art-B_'+pw+'_card'),'parade-art'));card.appendChild(rainbow(pw,'parade-word'));card.appendChild(model(course.sentences[pw]));
  spot.appendChild(card);root.appendChild(spot);
  actions([['Next word',advance],['Start again',reset]]);
 }else if(p.kind==='frame'){
  background(p.art||'art-E03_look_at_my');
  var fcopy=el('div','frame-copy');fcopy.appendChild(rainbow(p.frame||'Look at my...','frame-title'));var chip=el('div','frame-chip');chip.appendChild(rainbow(w,'frame-word'));fcopy.appendChild(chip);root.appendChild(fcopy);
  actions([['Next word',advance],['Start again',reset]]);
 }else if(p.kind==='path'){
  var stones=p.stones||[words[0],words[1],words[0],words[1]];var n=stones.length;
  var path=el('div','mirror-path-board');path.setAttribute('data-count',n);var svg=el('div','path-line');
  if(n<=4)svg.innerHTML='<svg viewBox="0 0 1000 390" aria-hidden="true"><path d="M70 295 Q260 295 300 110 T560 115 T880 270" fill="none" stroke="#ffc96b" stroke-width="85" stroke-linecap="round"/><path d="M70 295 Q260 295 300 110 T560 115 T880 270" fill="none" stroke="#fff5ce" stroke-width="4" stroke-dasharray="10 20"/></svg>';
  else svg.innerHTML='<svg viewBox="0 0 1000 390" aria-hidden="true"><path d="M85 300 Q170 190 285 105 T520 110 T750 115 T935 285" fill="none" stroke="#ffc96b" stroke-width="70" stroke-linecap="round"/><path d="M85 300 Q170 190 285 105 T520 110 T750 115 T935 285" fill="none" stroke="#fff5ce" stroke-width="4" stroke-dasharray="10 20"/></svg>';
  path.appendChild(svg);
  var poses4=[[2,49],[25,0],[53,0],[77,49]];
  var poses6=[[0,44],[17.5,0],[35,44],[52.5,0],[70,44],[84,0]];
  stones.forEach(function(x,i){var b=tile(x,function(){if(i!==s.round){feedback('Follow the next stepping stone.');return;}s.round++;render();},'path-stop '+(i<s.round?'visited':'')+(i===s.round?' current':''));
   var ps=n<=4?poses4[i]:poses6[i];b.style.left=ps[0]+'%';b.style.top=ps[1]+'%';path.appendChild(b);});
  root.appendChild(path);root.appendChild(model(s.round>=n?'We did it!':('Touch your '+stones[s.round]+'.'),'book-bottom-model'));actions([['Start again',reset]]);
 }else if(p.kind==='summary'){
  stars();var hero=el('div','book-achievement',p.cheer||'Great job, little explorer!');root.appendChild(hero);
  var field=el('div','summary-field');field.setAttribute('data-count',words.length);
  words.forEach(function(x){var card=tile(x,null,'summary-card');card.appendChild(model(course.sentences[x]));field.appendChild(card);});
  root.appendChild(field);root.appendChild(model(p.cheerLine||'You looked, listened and tried!','summary-cheer'));
 }else if(p.kind==='extension'){
  var field=el('div','bubble-field');field.setAttribute('data-count',1);field.appendChild(tile(p.word,null,'bubble extra-card'));root.appendChild(field);root.appendChild(model(p.sentence,'book-bottom-model'));
 }
}

function workshop(c,p,s){
 var ws=p.words||course.words, turn=(s.round||0)%(p.turns?p.turns.length:ws.length), w=ws[turn%ws.length];
 var root=el('div','u1-workshop mode-'+p.mode), visual=el('div','u1-visual');
 c.appendChild(root);root.appendChild(visual);
 function art(name,cl){var a=pic(name,cl||'');return a;}
 function line(t){var a=el('div','u1-line',t);root.appendChild(a);return a;}
 function tiles(words,fn,labels){var r=el('div','u1-tiles count-'+words.length);words.forEach(function(x,i){var b=fn?button('',function(){fn(x,i,b);},'u1-tile'):el('div','u1-tile');b.dataset.word=x;b.appendChild(art(x));if(labels!==false)b.appendChild(wordLabel(x));r.appendChild(b);});visual.appendChild(r);return r;}
 function controls(items){var r=el('div','u1-controls');items.forEach(function(a){r.appendChild(button(a[0],a[1],'small'));});root.appendChild(r);}
 function advance(){states[page]=fresh();state().round=(s.round||0)+1;render();}
 function reset(){states[page]=fresh();render();}
 var t=p.turns?p.turns[turn]:null;
 if(p.mode==='scene'||p.mode==='act'||p.mode==='talk'||p.mode==='chant'){
   visual.appendChild(art(p.art||('scene-'+ws[0]),'u1-scene'));
   if(p.mode==='talk'){
     var bubbles=el('div','u1-dialogue');
     bubbles.appendChild(el('div','u1-bubble',t[0]));
     if(s.done)bubbles.appendChild(el('div','u1-bubble reply',t[1]));
     root.appendChild(bubbles);
     controls([[(s.done?'Hide reply':'Show reply'),function(){s.done=!s.done;render();}],['Next turn',advance],['Start again',reset]]);
   }else{
     line(t||p.text||'Look and tell me.');
     controls([[p.mode==='act'?(s.hidden?'Show model':'Hide model'):'Next moment',p.mode==='act'?function(){s.hidden=!s.hidden;render();}:advance],['Next turn',advance],['Start again',reset]]);
     if(s.hidden){root.querySelector('.u1-line').textContent='Your turn!';visual.classList.add('model-hidden');}
   }
 }else if(p.mode==='word'){
   visual.appendChild(art(p.word,'u1-word-art'));line(p.word).classList.add('u1-bigword');line(p.sentence);
 }else if(p.mode==='listen'){
   tiles(ws,function(x,i,b){if(x===w){s.selected=x;b.classList.add('selected');feedback('Here it is!');}else{bounce(b);feedback('Listen and try again.');}},true);
   line(s.selected?'Look at my '+s.selected+'.':'Listen and point.');
   controls([['Show picture',function(){s.selected=w;render();}],['Next turn',advance],['Start again',reset]]);
   if(s.selected){var selected=visual.querySelector('[data-word="'+s.selected+'"]');if(selected)selected.classList.add('selected');}
 }else if(p.mode==='peek'){
   var box=el('div','u1-mosaic');box.appendChild(art(w));
   for(var i=0;i<6;i++){(function(k){var b=button('',function(){s.revealed[k]=true;render();},'u1-shutter');b.setAttribute('aria-label','Reveal picture piece '+(k+1));b.style.left=(k%3)*33.333+'%';b.style.top=Math.floor(k/3)*50+'%';if(s.revealed[k])b.classList.add('open');box.appendChild(b);})(i);}
   visual.appendChild(box);line(s.done?wordInfo(w).sentence:'What can you see?');
   controls([['Show picture',function(){s.done=true;for(var k=0;k<6;k++)s.revealed[k]=true;render();}],['Next picture',advance],['Start again',reset]]);
 }else if(p.mode==='memory'){
   var pair=ws.slice(turn,turn+3);if(pair.length<2)pair=ws.slice(0,3);
   var missing=(s.round||0)%pair.length;
   var r=tiles(pair,null,true);
   if(s.hidden&&!s.done){r.children[missing].classList.add('remember-hidden');}
   line(s.done?('Here are my '+pair[missing]+'.').replace('my nose','my nose'):(s.hidden?'What is missing?':'Look carefully.'));
   if(s.done)root.querySelector('.u1-line').textContent=course.sentences[pair[missing]];
   controls([['Hide one',function(){s.hidden=true;s.done=false;render();}],['Show answer',function(){s.done=true;render();}],['Next turn',advance],['Start again',reset]]);
 }else if(p.mode==='sequence'){
   tiles(ws.slice(0,2),null,!s.hidden);
   line(s.hidden?'Your turn!':t);
   controls([[s.hidden?'Show steps':'Hide steps',function(){s.hidden=!s.hidden;render();}],['Next mission',advance],['Start again',reset]]);
 }else if(p.mode==='silly'){
   tiles([w],null,true);line(s.done?course.sentences[w]:t);
   controls([[s.done?'Try the silly line':'Show our answer',function(){s.done=!s.done;render();}],['Next turn',advance],['Start again',reset]]);
 }else if(p.mode==='sort'){
   var r=tiles(ws,function(x,i,b){s.selected=x;render();},true);
   var bins=el('div','u1-bins');(p.groups||['One','Two']).forEach(function(group,gi){var b=button(group,function(){if(!s.selected){feedback('Choose a picture first.');return;}var expected=(p.answers||{})[s.selected];if(expected===gi){s.marked[s.selected]=gi;s.selected=null;render();}else feedback('Let’s try together.');},'u1-bin');var collection=el('div','u1-collected');Object.keys(s.marked).forEach(function(x){if(s.marked[x]===gi)collection.appendChild(wordLabel(x));});b.appendChild(collection);bins.appendChild(b);});root.appendChild(bins);
   Object.keys(s.marked).forEach(function(x){var b=r.querySelector('[data-word="'+x+'"]');if(b)b.classList.add('sorted');});if(s.selected){var b=r.querySelector('[data-word="'+s.selected+'"]');if(b)b.classList.add('selected');}
   controls([['Start again',reset]]);
 }else if(p.mode==='celebrate'){
   var pair=ws.slice(turn*2,turn*2+2);if(!pair.length)pair=ws.slice(0,2);
   tiles(pair,null,true);line('Great job! You listened and tried!');
   var models=el('div','u1-models');pair.forEach(function(x){models.appendChild(el('div','',course.sentences[x]));});root.appendChild(models);
   if(ws.length>2)controls([['Next pictures',function(){s.round=((s.round||0)+1)%Math.ceil(ws.length/2);render();}]]);
 }
}

function render(){stopMedia();stage.removeAttribute('data-book-kind');stage.removeAttribute('data-book-tone');stage.innerHTML='';var h=el('header','teacher-tools');var tools=el('div','tools');tools.appendChild(iconButton('Lesson home','home',function(){go(0);}));tools.appendChild(iconButton('Teacher guide','book',showNotes));tools.appendChild(button('Pages',showChapters,'chapter-toggle'));tools.appendChild(button('Reset',function(){states[page]=fresh();render();},'chapter-toggle'));tools.appendChild(iconButton('Teacher cheers','star',openCheers));var m=iconButton(muted?'Unmute all sounds':'Mute all sounds',muted?'mute':'music',setMute);m.id='mute';tools.appendChild(m);h.appendChild(tools);stage.appendChild(h);
if(!course){var picker=el('div','coursepicker');picker.style.cssText='position:absolute;inset:210px 270px;overflow:auto';Object.keys(pack.courses).forEach(function(k){picker.appendChild(button(k+' · '+pack.courses[k].title,function(){location.href=k+'.html';},'primary'));});stage.appendChild(picker);return;}
// Per-unit theme background: each unit shows its own themed room instead of the
// single shared playroom. Overrides the CSS default; scene-shell keeps content clean.
stage.style.backgroundImage="url('"+(course?mediaUrl('assets/unit-bg-U'+('0'+course.unit).slice(-2)+'.webp'):'assets/playroom.webp')+"')";stage.style.backgroundSize='cover';stage.style.backgroundPosition='center';stage.style.backgroundRepeat='no-repeat';
var p=course.pages[page],s=state(),g=goodbye(),heading=studentTitle(p);stage.setAttribute('data-scene-type',p.type);stage.setAttribute('data-scene-id',p.sceneId);stage.setAttribute('data-version',pack.version);var frame=el('div','scene-shell');frame.setAttribute('aria-hidden','true');stage.appendChild(frame);var rewards=el('aside','reward-rail');rewards.setAttribute('aria-label','Teacher rewards');[['good','Good job!'],['excellent','Excellent!'],['amazing','Amazing!'],['highfive','High five!']].forEach(function(a){rewards.appendChild(button(a[1],function(){reward(a[0],a[1]);},'reward-button'));});stage.appendChild(rewards);if(heading){var head=el('div');head.id='heading';head.appendChild(el('h1','',heading));stage.appendChild(head);}var c=el('section');c.id='content';c.className='game-'+p.type;stage.appendChild(c);
if(p.type==='book'){storybook(c,p,s);}
else if(p.type==='workshop'){workshop(c,p,s);}
else if(p.type==='cover'){var cover=el('div','topic-cover');cover.appendChild(el('div','cover-level','Level 0 · Unit '+course.unit+' · Lesson '+course.lesson));cover.appendChild(el('h2','cover-topic',course.title));var previews=row();(course.coverWords||course.words.slice(0,2)).forEach(function(w){var tile=el('div','cover-target');tile.appendChild(pic(w));tile.appendChild(wordLabel(w));previews.appendChild(tile);});cover.appendChild(previews);cover.appendChild(el('div','cover-model',course.primaryModel));cover.appendChild(button('Let’s begin',function(){go(1);},'primary'));c.appendChild(cover);}
else if(p.type==='song'||p.type==='goodbye')media(c,p.type==='goodbye');
else if(p.type==='model'){var r=row();r.classList.add('model');r.appendChild(pic(p.pose||'jojo-wave','character'));var v=el('div');if((course.unit===8&&p.sentence.indexOf(' and ')>=0)||(course.unit===6&&p.sentence.indexOf(' but ')>=0)){var duo=row();duo.classList.add('model-duo');course.words.slice(0,2).forEach(function(w){duo.appendChild(card(w,function(){},'',true));});v.appendChild(duo);}else v.appendChild(card(p.imageWord||p.word,function(){},'',true));v.style.textAlign='center';v.appendChild(learningLine(p.word,p.sentence));r.appendChild(v);c.appendChild(r);}
else if(p.type==='story')story(c,p,s);
else if(p.type==='routine')routine(c,p,s);
else if(p.type==='memory')memory(c,p,s);
else if(p.type==='summary')achievement(c,p,s);
else if(p.type==='album')album(c,p,s);
else if(p.type==='reveal')reveal(c,p,s);
else if(p.type==='choose'||p.type==='mission')choose(c,p,s);
else if(p.type==='shadow')shadow(c,p,s);
else if(p.type==='spotlight')spotlight(c,p,s);
else if(p.type==='wheel')wheel(c,p,s);
else if(p.type==='whack')whack(c,p,s);
else if(p.type==='claw')claw(c,p,s);
else if(p.type==='face')faces(c,p,s);
else if(p.type==='scene')act(c,p,s,'scene');
else if(p.type==='puppet')act(c,p,s,'puppet');
else if(p.type==='choice'){var cr=el('div','choice');var more=button('More time? Keep exploring',function(){var o=firstOptional();go(o<0?g:o);},'primary');var done=button('Time to finish? Goodbye song',function(){go(g);},'');more.setAttribute('aria-label','More time? Keep exploring');done.setAttribute('aria-label','Time to finish? Goodbye song');cr.appendChild(more);cr.appendChild(done);c.appendChild(cr);}
else if(p.type==='notes'){c.appendChild(el('p','lesson-end','Thank you for learning together!'));c.appendChild(button('Teacher notes',showNotes,'primary'));}
if(p.extensionSentence)c.appendChild(el('div','learning-sentence extension-line',p.extensionSentence));
Array.prototype.forEach.call(c.querySelectorAll('.hint,.eyebrow,.mission-progress,.goal,.book-title,.act-label,.act-empty,.turn-line,.subtitle'),function(e){e.remove();});
Array.prototype.forEach.call(c.querySelectorAll('.row'),function(r){if(r.querySelector('button.icon-control')&&r.querySelectorAll('button').length===r.querySelectorAll('button.icon-control').length)r.classList.add('activity-controls');});
var f=el('div','sr-only','');f.id='feedback';f.setAttribute('aria-live','polite');stage.appendChild(f);var nav=el('nav','edge-navigation');nav.setAttribute('aria-label','Lesson navigation');nav.appendChild(iconButton('Previous page','left',function(){go(page-1);},'edge-prev'));if(p.type!=='choice' && page!==g)nav.appendChild(iconButton(p.optional&&page===course.pages.length-1?'Goodbye song':'Next page','right',next,'edge-next'));if(p.optional&&page!==course.pages.length-1)nav.appendChild(iconButton('Goodbye song','close',function(){go(g);},'explore-exit'));stage.appendChild(nav);fit();}
try{if(!pack||!pack.courses)throw Error('Lesson data unavailable');render();}catch(e){stage.innerHTML='<div id="startup"><h1>The lesson could not start.</h1><p>Please reload this page.</p><button onclick="location.reload()">Reload lesson</button></div>';console.error(e);}
window.addEventListener('keydown',function(e){if(!course||panel||['SELECT','INPUT','TEXTAREA','VIDEO'].indexOf(document.activeElement.tagName)>=0)return;if(e.key==='1')reward('good','Good job!');if(e.key==='2')reward('excellent','Excellent!');if(e.key==='3')reward('amazing','Amazing!');if(e.key==='4')reward('highfive','High five!');if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')go(page-1);});
})();
