# SandJs
浏览器端的CommonJs模块加载库，可以随意分组打包模块文件。

因为目前比较流行的RequireJs和SeaJs等模块加载库需要遵循AMD和CMD规范，没有NodeJs那样简洁。而Browserify则必须打包文件后才能运行，所以我就尝试实现一个类NodeJs代码风格的轻量级模块加载库，在开发阶段可以不打包文件，前端无需接触服务器，还可以随意分组打包模块。目前sandjs.min.js不足2kb。

## 如何使用

- 定义模块(js/a.js)
```
var name = 'SandJs';
exports.show = function(){
  console.log(name);
}
```
- 获取模块(js/b.js)
```
var a = request('a.js');//同步
a.show();

request('a.js', function(a){ a.show();});//异步
```
- 浏览器中初始化sand.js
```
<script src="js/sand.min.js" charset="utf-8"></script>
<script type="text/javascript">
	SandJs.initConfig('js/', false, function(){
	    SandJs.require('b.js', function(b){});
	});
</script>
```

## 配置
- 配置文件格式(SandJsConfig.js)
```
SandJs.baseUrl = 'js/';//模块路径的前缀
SandJs.duneUrl = 'js/dune/';//模块打包路径
SandJs.modulePaths = [
  [
    'a.js',
    'b.js'
  ],
  [
    'd.js'
  ]
]
```
baseUrl表示模块源文件所在路径的前缀，duneUrl表示模块文件打包后的存放路径，modulePaths是一个交叉数组，打包时通过分析这个数组，将对应项里的文件分别打包为dune0.js、dune1.js...，加载模块时如果使用了配置文件，则会优先检查模块路径是否在配置中，如果在则加载dune*.js文件。

- initConfig方法
```
SandJs.initConfig = function(configPath, useConfig, callback){}
```
useConfig为true时，configPath表示配置文件的url
```
SandJs.initConfig('SandJsConfig.js', true, ...);
```
为false时，configPath表示SandJs.baseUrl
```
SandJs.initConfig('js/', false, ...);
```

## 模块打包（未完成）
打包工具可以根据配置文件把模块文件打包成如下格式，SandJs从打包文件中获取模块定义，不需要再加载单独的模块文件
```
SandJs.__source__['a.js'] = function(SandJs, path){
  var m = {'exports':{}};
  !function(require, exports, module){
    //这里拷贝a.js的内容
  }(SandJs.require, m.exports, m)
  SandJs.modules[path] = m.exports;
};

......

['a.js','b.js',...].forEach(function(path){
  //这里必须要判断__source__[path]是否为null
  //因为a模块可能优先获取了b模块，这时__source__['b.js']为null
  if(SandJs.__source__[path]){
    SandJs.__source__[path](SandJs, path);
    SandJs.__source__[path] = null;
  }
})
```

## 其他
- 另一种定义模块的方式
```
module.exprots = {
  name:'SandJs',
  show:function(){
    //todo
  }
}
```
- 实现原理
SandJs通过XMLHttpRequest对象实现同步和异步加载文件，使用new Function方法定义函数，然后传入require,exports,module参数运行函数，类似于nodejs对源代码使用function(require, exports, module){}进行包装。

## TODO
- 实现模块分组打包
- 处理模块打包文件加载完成之前可能重复加载文件的问题