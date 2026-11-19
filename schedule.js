(()=>{
  const list=document.getElementById('schedule-list');
  const fallback=document.getElementById('schedule-fallback');
  const fmt=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
  const showMessage=message=>{fallback.hidden=true;list.classList.remove('single');list.replaceChildren(el('p','schedule-state',message))};

  /* 日付を「12/1」「(水) 17:10」に分ける (日本時間) */
  function dateParts(iso){
    const p=Object.fromEntries(fmt.formatToParts(new Date(iso)).map(x=>[x.type,x.value]));
    return{day:`${p.month}/${p.day}`,rest:`(${p.weekday}) ${p.hour}:${p.minute}`};
  }

  function card(video){
    const a=el('a','live-card');a.href=video.url;a.target='_blank';a.rel='noopener';
    const thumb=el('span','thumb');
    const img=new Image();img.alt='';img.loading='lazy';
    /* 大きめのサムネイルを使い、無ければ保存されているものに戻す */
    const small=video.thumbnail||'';
    img.src=video.id?`https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`:small;
    const back=()=>{if(small&&img.src!==small)img.src=small};
    img.addEventListener('error',back,{once:true});
    /* YouTubeは画像が無いとき 120x90 の灰色の仮画像を返すので、それも戻す */
    img.addEventListener('load',()=>{if(img.naturalWidth<=120)back()});
    thumb.append(img,el('span','badge','配信予定'));
    const body=el('span','live-body');
    const time=el('span','live-date');
    if(video.scheduledStartTime){
      const d=dateParts(video.scheduledStartTime);
      time.append(el('b',null,d.day),el('span',null,d.rest+' 開始予定'));
    }else time.append(el('span',null,'日時未定'));
    body.append(time,el('span','live-title',video.title));
    a.append(thumb,body);
    return a;
  }

  async function loadSchedule(){
    try{
      const response=await fetch(new URL('schedule.json',document.baseURI),{cache:'no-store'});
      const data=await response.json();
      if(data.status==='quota_exceeded'){list.replaceChildren();fallback.hidden=false;return}
      if(!response.ok||data.status!=='ok')throw new Error('Schedule data is unavailable');
      const videos=(data.items||[]).sort((a,b)=>new Date(a.scheduledStartTime||0)-new Date(b.scheduledStartTime||0));
      if(!videos.length){showMessage('現在、公開されている配信予定はありません。');return}
      list.classList.toggle('single',videos.length===1);
      list.replaceChildren(...videos.map(card));
    }catch(error){
      console.error('Schedule data could not be loaded:',error);
      showMessage('配信予定を読み込めませんでした。');
    }
  }
  loadSchedule();
})();
