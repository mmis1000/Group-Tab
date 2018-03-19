/*
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

*/


let cut = (str)=>{
  return browser.runtime.sendMessage({
    str
  }).then((res)=>{
      // console.log('recieve ' + res);
      return res;
  }, (err)=>{
      console.error(err);
  })
}