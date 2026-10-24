(()=>{
  const list=document.getElementById('schedule-list');
  const fallback=document.getElementById('schedule-fallback');
  const formatter=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'});
  const showMessage=message=>{fallback.hidden=true;list.replaceChildren();const p=document.createElement('p');p.className='schedule-state';p.textContent=message;list.append(p)};

  async function loadSchedule(){
    try{
      const response=await fetch(new URL('schedule.json',document.baseURI),{cache:'no-store'});
      const data=await response.json();
      if(data.status==='quota_exceeded'){
        list.replaceChildren();fallback.hidden=false;return;
      }
      if(!response.ok||data.status!=='ok')throw new Error('Schedule data is unavailable');
      const videos=(data.items||[]).sort((a,b)=>new Date(a.scheduledStartTime||0)-new Date(b.scheduledStartTime||0));
      list.replaceChildren();
      videos.forEach(video=>{
        const card=document.createElement('a');card.className='schedule-card';card.href=video.url;card.target='_blank';card.rel='noopener';
        const image=document.createElement('img');image.src=video.thumbnail||'';image.alt='';image.loading='lazy';
        const body=document.createElement('span');
        const title=document.createElement('span');title.className='schedule-title';title.textContent=video.title;
        const time=document.createElement('span');time.className='schedule-time';
        const start=video.scheduledStartTime;time.textContent=start?formatter.format(new Date(start))+' 配信開始予定':'配信予定';
        body.append(title,time);card.append(image,body);list.append(card);
      });
      if(!videos.length)showMessage('現在、公開されている配信予定はありません。');
    }catch(error){
      console.error('Schedule data could not be loaded:',error);
      showMessage('配信予定を読み込めませんでした。');
    }
  }
  loadSchedule();
})();
