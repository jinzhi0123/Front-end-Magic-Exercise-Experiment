class Vue {
    constructor(obj_instance) {
        this.$data = obj_instance.data;
        Observer(this.$data)
        Compile(obj_instance.el, this)
    }
}

//数据劫持 - 监听实例里的数据
function Observer(data_instance) {
    // 递归出口
    if (!data_instance || typeof data_instance !== 'object') return
    const dependency = new Dependency()
    Object.keys(data_instance).forEach(key => {
        // 由于Object.defineProperties会覆写属性，所以需要先保存一份数据
        let value = data_instance[key];
        // 递归 - 子属性数据劫持
        Observer(value)
        Object.defineProperty(data_instance, key, {
            enumerable: true,
            configurable: true,
            get() {
                console.log(`访问了属性：${key} -> 值:${value}`)
                Dependency.temp && dependency.addSub(Dependency.temp)
                Dependency.temp && console.log(Dependency.temp) 
                return value;
            },
            set(newValue) {
                console.log(`属性${key}的值${value} -> ${newValue}`)
                value = newValue
                Observer(newValue)
                dependency.notify()
            }
        })
    })
}

function Compile(element, vm) {
    vm.$el = document.querySelector(element)
    const fragment = document.createDocumentFragment()
    let child
    while (child = vm.$el.firstChild) {
        // 把所有的节点放入fragment
        fragment.append(child)
    }
    fragment_compile(fragment)
    // 替换文档碎片内容
    function fragment_compile(node) {
        const pattern = /\{\{\s*(\S+)\s*\}\}/;
        if (node.nodeType === 3) {
            const xxx = node.nodeValue
            const result_regex = pattern.exec(node.nodeValue);
            if (result_regex) {
                const arr = result_regex[1].split('.');
                const value = arr.reduce((total, current) => total[current], vm.$data)
                node.nodeValue = xxx.replace(pattern, value)
                // 创建订阅者
                new Watcher(vm, result_regex[1], newValue => { node.nodeValue = xxx.replace(pattern, newValue) })
            }
            return
        }
        if (node.nodeType === 1 && node.nodeName === 'INPUT') {
            const attr = Array.from(node.attributes)
            attr.forEach(i =>{
                if (i.nodeName === 'v-model'){
                    console.log(i.nodeValue)
                    const value = i.nodeValue.split('.').reduce((total, current) => total[current], vm.$data)
                    node.value = value
                    new Watcher(vm, i.nodeValue, newValue => { node.value = newValue })
                    node.addEventListener('input',e=>{
                        //取值与赋值不同，需要明确知道属性名
                            const arr1 = i.nodeValue.split('.')
                            const arr2 = arr1.slice(0,arr1.length-1)
                            const final = arr2.reduce((total,current)=>total[current], vm.$data)
                            final[arr1[arr1.length-1]] = e.target.value

                    })
                }
            })
        }
        node.childNodes.forEach(child => fragment_compile(child))
    }
    vm.$el.appendChild(fragment)
}

//依赖 - 收集和通知订阅者
class Dependency {
    constructor() {
        this.subscribers = [];
    }
    addSub(sub) {
        this.subscribers.push(sub);
    }
    notify() {
        this.subscribers.forEach(sub => sub.update());
    }
}

// 订阅者
class Watcher {
    constructor(vm, key, callback) {
        this.vm = vm
        this.key = key
        this.callback = callback
        Dependency.temp = this
        console.log(`用属性${key}创建订阅者`)
        //为了触发getter
        key.split('.').reduce((total, current) => total[current], vm.$data)
        //防止重复触发getter，所以清空temp
        Dependency.temp = null
    }
    update() {
        const value = this.key.split('.').reduce((total, current) => total[current], this.vm.$data)
        this.callback(value)
    }
}
