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
                return value;
            },
            set(newValue) {
                console.log(`属性${key}的值${value} -> ${newValue}`)
                vaule = newValue
                Observer(newValue)
            }
        })
    })
}

function Compile(element, vm) {
    vm.$el = document.querySelector(element)
    const fragment = document.createDocumentFragment()
    let child
    while (child = vm.$el.firstChild) {
        fragment.append(child)
    }
    fragment_compile(fragment)

    function fragment_compile(node) {
        const pattern = /\{\{\s*(\S+)\s*\}\}/;
        if (node.nodeType === 3) {
            const result_regex = pattern.exec(node.nodeValue);
            if (result_regex) {
                console.log(node.nodeValue)
                console.log(result_regex)
            }
        }
        node.childNodes.forEach(child => fragment_compile(child))
    }

}