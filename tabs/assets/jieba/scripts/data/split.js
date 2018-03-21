let fs = require('fs')

let original = require('./dictionary.json')

let write = (name, content)=>
    new Promise(
        (resolve, reject)=>
            fs.writeFile(name, content, (err)=> {
                err ? reject(err) : resolve()
            })
    )

let size = 10000;
let index = 0;

let split = async ()=> {
    while (chunk = original.splice(0, size)) {
        if (chunk.length === 0) {
            break;
        }
        await write(`dictionary.split.${index++}.json`, JSON.stringify(chunk))
    }
}

split();