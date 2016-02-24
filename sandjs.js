/**
 * Sand.js 客户端的CommonJs模块加载库
 */
 
;(function(window){
  'use strict';
  var SandJs = {};
  //存储模块源码的集合，用于解决模块的依赖延迟编译的问题
  SandJs.__source__ = {};
  //存储模块的集合
  var modules = SandJs.modules = {};
  
  /**
   * 初始化配置
   *
   * @param {String} configPath 配置文件的url或模块文件的url前缀
   * @param {Boolean} useConfig true表示使用模块打包，并加载配置文件，false表示直接加载模块文件
   * @param {Function} callback 可选，使用异步方法加载配置文件
   */
  SandJs.initConfig = function(configPath, useConfig, callback){
    if(SandJs.baseUrl) return;
    
    if(useConfig){
      new Loader(configPath, callback, true);
    }else{
      SandJs.baseUrl = configPath;
      if(callback) callback();
    }
  }
  
  /**
   * 获取模块，传入callback参数异步加载，不传入则同步
   *
   * @param {String} path 模块路径，不包括路径前缀（initConfig设置的SandJs.baseUrl）
   * @param {Function} callback 可选，回调方法function(module){}
   * @return 同步加载会返回模块定义
   */
  SandJs.require = function(path, callback){
    if(path && typeof path === 'string'){
      var _s_ = SandJs.__source__[path];
      if(callback && typeof callback === 'function'){
        if(modules[path] || (_s_ && createFromDune(_s_, path))){
          //已存在的模块通过setTimeout实现异步
          setTimeout(
            function asyncCall(m){
              m.callback(m.module);
            }
            , 0
            , {'callback':callback, 'module':modules[path]}
          );
        }else{
          //异步加载模块
          new Loader(path, callback);
        }
      }else{
        if(modules[path] || (_s_ && createFromDune(_s_, path))){
          //已存在的模块直接返回
          return modules[path];
        }else{
          //同步加载模块
          new Loader(path);
          return modules[path];
        } 
      }
    }
  }
  
  /**
   * 模块加载器
   *
   * @param {String} path 模块路径
   * @param {Function} callback 可选，回调方法function(module){}
   * @param {Boolean} isDune 可选，标志加载内容是否为打包的模块集合，如果true，path必须是全路径，只用于加载配置文件
   */
  function Loader(path, callback, isDune){
    var _this = this;
    _this.path = path;
    _this.callback = callback;
    _this.onComplete = _this._onComplete.bind(_this);
    
    var r = isDune ? {'path':path, 'isDune':true} : _this.parsePath(path);
    _this.isDune = r.isDune;
    
    var xhr = _this.xhr = new window.XMLHttpRequest();
    xhr.addEventListener('load', _this.onComplete, false);
    
    try{
    	xhr.open('GET', r.path, !!callback);
      xhr.send();
    }catch(e){
    	_this.release();
    }
  }
  
  Loader.prototype._onComplete = function(){
    var _this = this;
    var path = _this.path;
    var isDune = _this.isDune;
    var callback = _this.callback;
    var status = _this.xhr.status;
    var txt = _this.xhr.responseText;
    //销毁加载对象后再解析模块文件
    _this.release();
    
    //加载本地文件时，status为0
    if (status === 200 || status === 204 || (status === 0 && txt.length > 0)) {
      if(isDune){
        (new Function('SandJs',txt))(SandJs);
        if(callback) callback(modules[path]);
      }else{
        var m = {'exports':{}};
        (new Function('require','exports','module',txt))(SandJs.require, m.exports, m);
        modules[path] = m.exports;
        if(callback) callback(m.exports);
      }
    }else{
      console.error('error[' + status + ']:' + path);
    }
  }
  
  Loader.prototype.release = function(){
    var _this = this;
    _this.xhr.removeEventListener('load', _this.onComplete);
    _this.onComplete = null;
    _this.callback = null;
    _this.isDune = null;
    _this.path = null;
    _this.xhr = null;
  }
  
  Loader.prototype.parsePath = function(path){
    if(SandJs.modulePaths){
      var mps = SandJs.modulePaths;
      for(var i = mps.length - 1; i>=0; i--){
        var bs = mps[i];
        if(bs.indexOf(path) > -1){
          //组装dune路径
          var p = SandJs.duneUrl + 'dune' + i + '.js';
          return {'path':p, 'isDune':true};
        }
      }
    }

    return {'path':SandJs.baseUrl + path, 'isDune':false};
  }

  /**
   * 从加载的打包文件中创建模块
   * 可以解决模块的依赖已经加载但未初始化而导致重新加载的问题
   *
   * @param {Function} source 模块定义函数
   * @param {String} path 模块路径
   */
  function createFromDune(source, path){
    source(SandJs, path);
    SandJs.__source__[path] = null;
    return true;
  }

  var oldSandJs;
  if(window.SandJs != undefined){
    oldSandJs = window.SandJs;
  }
  window.SandJs = SandJs;
  SandJs.noConflict = function(){
    window.SandJs = oldSandJs;
    return SandJs;
  }

})(this);