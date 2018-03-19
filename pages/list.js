let keywordCache = new LRUCache(-1, false, new LRUCache.LocalStorageCacheStorage());
let querying = browser.tabs.query({})
let pages = []

let id = 0;

function start() {
    querying.then((tabs)=>{        
        tabs.forEach((t)=>{
            if (t.title) {
                if (keywordCache.getItem(t.title.toLowerCase())) {
                    pages.push(Promise.resolve({
                        keywords: keywordCache.getItem(t.title.toLowerCase()),
                        title: t.title,
                        tab: t
                    }))
                } else {
                    pages.push(cut(t.title.toLowerCase()).then((res)=>{
                        res = res.filter((i)=> !/^[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]*$/.test(i));
                        
                        keywordCache.setItem(
                            t.title.toLowerCase(), 
                            res
                        );
                        
                        console.log(res);
                        
                        return {
                            keywords: res,
                            title: t.title,
                            tab: t
                        };
                    }));
                }
            }
        })
        
        Promise.all(pages).then((pages)=>{
            var keywords = pages.reduce((prev, curr)=>{
                curr.keywords.forEach((k)=>{
                    if (prev.indexOf(k) < 0) {
                        prev.push(k)
                    }
                })
                
                return prev;
            }, [])
            
            console.log(keywords);
            
            let sorted = keywords.map((w)=>{
                return {
                    id: id++,
                    keyword: w,
                    pages: pages.filter((page)=>page.keywords.indexOf(w) >= 0).map((o)=>{
                        o.checked = false;
                        o.id = id++;
                        return o;
                    })
                }
            })
            .sort((i, j)=>j.pages.length - i.pages.length)
            .filter((i)=>i.pages.length > 1)
            
            console.log(`groups has > 1 item: ${sorted.length}`);
            
            var app = new Vue({
              el: '#app',
              data: {
                groups: sorted
              }
            })
            
            /*
            $(test).remove();
            $('.main div').remove();
            
            sorted.forEach((item)=>{
                let icon = $('<div>').addClass('item').addClass('head').addClass('browser-style');
                
                let list = $('<div>').addClass('browser-style');
                
                let expand = $('<div>').addClass('expand-icon');
                
                expand.append($('<i class="fas fa-angle-down fa-2x"/>'));
                expand.click(()=>list.slideToggle())
                
                
                list.hide()
                
                icon.appendTo('.main')
                list.appendTo('.main')
                
                id++;
                
                let $iconCheckbox = $(`<input type="checkbox" id="input-${id}"/>`);
                let $iconCheckboxLabel = $(`<label for="input-${id}">`).text(`${item.keyword} (${item.pages.length})`);
                
                // icon.text(`${item.keyword} (${item.pages.length})`);
                expand.appendTo(icon);
                $iconCheckbox.appendTo(icon);
                $iconCheckboxLabel.appendTo(icon);
                
                $iconCheckbox.on('change', (ev)=>{
                    icon.removeClass('partial-selected');
                    if ($iconCheckbox.prop('checked')) {
                        list.find('input[type=checkbox]').prop('checked', true);
                    } else {
                        list.find('input[type=checkbox]').prop('checked', false);
                    }
                })
                
                
                item.pages.forEach((p)=>{
                    id++;
                    
                    let $itemCheckbox = $(`<input type="checkbox" id="input-${id}"/>`);
                    let $itemCheckboxLabel = $(`<label for="input-${id}">`).text(p.title);
                    
                    $itemCheckbox.on('change', (ev)=>{
                        if (list.find('input[type=checkbox]').map((_, item)=>$(item).prop('checked')).filter((_, i)=>i).length > 0) {
                            $iconCheckbox.prop('checked', true);
                            if (list.find('input[type=checkbox]').map((_, item)=>$(item).prop('checked')).filter((_, i)=>!i).length > 0) {
                                icon.addClass('partial-selected');
                            } else {
                                icon.removeClass('partial-selected');
                            }
                        } else {
                            $iconCheckbox.prop('checked', false);
                            icon.removeClass('partial-selected');
                        }
                        
                    })
                    
                    let $subItem = $('<div>').addClass('item').addClass('sub').addClass('browser-style');
                    $itemCheckbox.appendTo($subItem);
                    $itemCheckboxLabel.appendTo($subItem);
                    
                    $subItem.appendTo(list);
                })
            })
            */
            
        })
    })
}

start()