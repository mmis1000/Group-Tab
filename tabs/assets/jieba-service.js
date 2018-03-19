
require.config({ 
    waitSeconds : 30
})

window.jiebaQuerys = window.jiebaQuerys || [];
window.jiebaInstance = window.jiebaInstance || null;

let cut = (str)=>{
    return new Promise((resolve, reject)=>{
        if (window.jiebaInstance) {
            setTimeout(()=>{
                resolve(window.jiebaInstance.cut(str));
            })
        } else {
            jiebaQuerys.push({
                str: str,
                cb: resolve
            })
        }
    })
}

browser.runtime.onMessage.addListener(handle);

function handle(message, sender, sendResponse) {
  if ('object' !== typeof message || Array.isArray(message)) {
    return;
  }
  /*
  browser.notifications.create({
    "type": "basic",
    //"iconUrl": browser.extension.getURL("link.png"),
    "title": "test",
    "message": message.str + ' ' + message.id
  });
  */
  cut(message.str).then((keywords)=>{
      // console.log(keywords);
      setTimeout(()=>{
        // console.log('send ' + keywords)
        sendResponse(keywords)
      }, 10)
  }).catch((err)=>{
      console.error(err);
      browser.notifications.create({
        "type": "basic",
        //"iconUrl": browser.extension.getURL("link.png"),
        "title": "error test",
        "message": err.message
      });
  })
  
  return true;
}