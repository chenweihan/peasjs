/*
 * Created with Vim7.3 ubuntu10.04
 * @fileOverview : peasjs加载器
 * @author : Chen weihan <csq-3@163.com>  飞火 
 * @since : 2013年11月18日 星期一 21时32分17秒
 * @filename : peasjs.js
 * @version : v1.0
 * @description :  这里有3个难点： 1:引入文件的依赖的解决  2:执行函数的多依赖多层嵌套的解决 3:全局变量的先后使用的混乱
 * 如果回调要输出document.wirte()，需要按照下面写法，具体原因在document.write.        
 *   document.open(); 
 *   document.write("1111#可显示的文字内容<br/>"); 
 *   document.close();
 */

;(function(win){
     
     /**
      *  moduleTemp :{
      *      name : {
      *       name : name, //初始模块名 
      *       fordeps : {  //每个模块为KEY，单独保存当前状态的依赖链,因为初始模块的树形依赖存在异步加载,共享读写fordeps,会造成该变量混淆.
      *         a : all-deps
      *         b : all-deps
      *       }, 
      *       
      *  }
      *
      *  模块缓存 
      *  moduleCache : {
      *      name : {
      *        name : name, //模块名
      *        callback : callback, //回调
      *        state : 0, //加载状态
      *        deps : deps //依赖
      *      }
      *  }
      *
      */

     var debug = false,  //模块不会缓存，同时浏览器请求的js都是最新的[调试打开后,调试dome4.html即可明白]
         modulePath = 'modules/', //载入js的路径
         moduleTemp = {},   //用户use启始模块,临时保存,以方便找出依赖链
         moduleCache = {},  //缓存module模块
         nestedLevel = 10,  //保险机制,递归最多层级限制,以防检测递归树依赖异常,卡死。
         defsBool = false;  //判断依赖死循环.   
          
     
     /*********************私有方法*******************/
     //私有方法
     var method = {};

         /**
          * 加载
          * @param name 模块名
          */
         method.load = function(name) {
                var data = moduleCache[name],
                    names = data.deps;
                
                //循环载入js
                for(var i=0 ; i < names.length; i++ ) { 
                     //console.log('loaded module',names[i]);
                     if (this.beforeCreate(names[i])) {   
                         this.create(names[i]);
                         //console.log('loaded define module',names[i]);
                     }
                } 

         };
         
         /**
          * 创建模块加载前处理
          * @param name 模块名
          */         
         method.beforeCreate = function(name) {
                var bool = true;
                //判断缓存,如果没有缓存，缓存到队列
                if (typeof(moduleCache[name]) == 'undefined') {       
					 moduleCache[name] = { //这里加入cache，而不是异步返回的时候加入是避免一个加载很久的模块，在异步加载没有返回前，请求多次就加载几次都等着异步返回。
						 name : name,
						 state : 0,
					 }; 
                } else {
                   bool = false;
                }
                return bool;
         };

         /**
          * 
          */
         method.path = function(path) {
                var d = new Date();
                if (debug) {
                    path = path+"?time="+d.getTime();   
                }
                return path; 
         };

         /**
          * 创建dom,载入js
          * @param name 模块名
          */   
         method.create = function(name) {
             var head = document.getElementsByTagName('head').item(0),
                 script = document.createElement("script"); 
                 script.type = "text/javascript"; 
                 script.src = this.path(modulePath + name + '.js');
                 script.async = true;
                 script.onreadystatechange = script.onload = function() {
                       if (!this.readyState || this.readyState=='loaded' || this.readyState=='complete') {
                           head.removeChild(script);
                           script = null;
                       }
                 };
                 head.appendChild(script);  
         };

         /*
          * 检测关联依赖是否完成
          * @param name 
          * load页面如果是异步载入，每次都需要判断根的依赖,如果是同步，只需要判断，当前页的依赖即可. 
          * 1:回调函数的执行值，不能缓存到moduleCache,只能缓存回调函数.因有些模块是即时性的,例如获取当前时间，生成随机id.
          * 2:依赖关系的状态值，不能使用一个全局变量，需要使用全局变量依赖当前模块来为key保存，因当多个模块异步回来相近时间时，全局会造成属性值混乱.
          * 每个use进来的模块(启始模块),都需要这样一个缓存变量，所以直接挂接到moduleTemp对应的起始模块的属性fordeps
          *
          */
         method.checkDeps = function(name) {
              var bool  = false; 
              //从起点模块开始循环判断  如果moduleTemp中的模块执行完毕，会delete掉
              for (var i in moduleTemp) {
                   //single 与 pidObj 的区别在于 pidObj是随机key,这个给判断父级依赖有关,single的key是moduleName给依赖执行函数有关.
                   var  single = {},  //每个起点模块的依赖链模块,最后函数执行需要的临时缓存.
                        pidObj = {},  //判断树结构单链死循环，判断父级节点是否存在相同即可.
                        id = this.randomNum('m'), //随机id,pid,主要用于闭环父级查找死循环
                        fdeps = moduleTemp[i].deps; 
                        
                        //初始化当前模块对象
					    moduleTemp[i].fordeps[name] = {};
                        
                        //递归检测依赖加载
                        single[i] = {
                              name : i,     //模块名
                              deps : fdeps, //依赖
                              state : 0,    //函数执行状态
                              exports : {}  //缓存函数执行返回值
                        };
                       
                        //递归检测树单链闭环
                        pidObj[id] = {
                              name : i,      //模块名
                              id : id,       //随机id,pid,主要用于闭环父级查找死循环
                              pid : ''
                        };
                       
                        //依赖递归检测  
                        this.forDeps(fdeps,i,name,single,pidObj,id); 
                        
                        //每个模块载入判断是否加载完成 
                        bool = this.allLoaded(single);

                    if (bool && !defsBool) {      
                        this.fireFactory(i,single);
                        //use的起点是随机的模块名,不可能在调用，清除以节约内存
                        delete moduleTemp[i];
                        delete moduleCache[i];
                    }
               } 
         };

         /**
          * 检测依赖是否载入完毕
          * @param startModule     起点模块
          * @param currentModule   当前模块
          * @return bool   
          */
         method.allLoaded = function(single) {
              var bool = true;
              for (var i in single) {
                  var state = moduleCache[single[i].name].state;
                  if (!state) {
				     bool = false;
					 break;
				  }
			  }
			  return bool;
         }; 

         /**
          * 触发回调函数
          * @param startMOdule 起点模块
          * @param obj 所有依赖链函数结构队列 
          */
         method.fireFactory = function(startModule,obj) {
              //递归拼接执行函数
              //console.log(startModule,obj);
              var bool = true;

              for (var i in obj) {
                   if (!obj[i].state) {
                      method.fireFactoryHandle(obj[i],obj);            
                      bool = false;
                   }              
              }  
              
              if (bool) {
                   obj = null; 
              } else  {
				   arguments.callee(startModule,obj); 
              }            
         };

         /**
          *  依赖链函数执行，及保存结果
          *  @param mod  当前依赖函数  
          *  @param obj  整个依赖链函数队列
          *  只返回当前依赖模块的对象,只能调用当前依赖的模块
          */
         method.fireFactorySingleHandle = function(mod,obj) {
                 //判断依赖
                 var deps = mod.deps,
                     callback = moduleCache[mod.name].callback; 

                 if (deps.length > 0 ) {
                     var bool = true,args=[];
                     for (var x in deps) {
                         if(!obj[deps[x]].state) {
                            bool = false;
                         } else {
                            args.push(obj[deps[x]].exports);
                         }                     
                     } 
                     if (bool) {
                         obj[mod.name].state = 1;
                         obj[mod.name].exports = callback.apply(null,args);
                     }
                 } else {
                     obj[mod.name].state = 1;
                     obj[mod.name].exports = callback();
                 }
         };
         
         /**
          *  返回所需依赖链，包括依赖的依赖的对象
          *  @param mod  当前依赖函数  
          *  @param obj  整个依赖链函数队列
          *  这样更灵活,可以调用依赖链上任意提供对外的接口对象
          */
         method.fireFactoryHandle = function(mod,obj) {
                 //判断依赖
                 var deps = mod.deps,
                     bool = true,
                     exports = {},
                     callback = moduleCache[mod.name].callback; 

                 if (deps.length > 0 ) {
                     for (var x in deps) {
                         if(!obj[deps[x]].state) {
                            bool = false;
                         } else {
                            var exObj = obj[deps[x]].exports;
                            for (var i in exObj) { 
                                exports[i] =  exObj[i]; 
                            }
                         }                     
                     } 
                     if (bool) {
                         obj[mod.name].state = 1;
                         exports[mod.name] = callback(exports);
                         obj[mod.name].exports = exports;
                     }
                 } else {
                     obj[mod.name].state = 1;
                     exports[mod.name] = callback({});
                     obj[mod.name].exports = exports;
                 }
         };
         
         /**
          * 生成随机数唯一 
          */
         method.randomNum = function(prefix) {
              return  prefix + (new Date().getTime()) + Math.floor(Math.random()*100000);
         };
         
         /**
          * 判断依赖数单链是否存在死循环,上线10依赖  是否可以优化判断自己是否存在依赖即可
          */
         method.infiniteLoops = function(id,pidObj,name,level,debug) {
            if (level > 0) {
                level--;
                if (id !== '') {
                   var pid = pidObj[id].pid;
                   if (pid !== '') {
                       //console.log('for',pidObj[pid].name,name);
                       debug += '->'+pidObj[pid].name;
                       if (pidObj[pid].name !== '' && pidObj[pid].name == name) {
                           console.log('异常:'+name+'模块载入检测依赖发现闭环,运行失败。具体依赖链'+debug);
                           defsBool = true; //全局修改判断依赖死循环 
                           return;
                       } else {
                           arguments.callee(pid,pidObj,name,level,debug);
                       }
                   }
                }
            } else {
               defsBool = true;
               console.log('依赖嵌套超过配置的层级了,如是正常情况，请增加配置层级数!!!');
               return;
            }
         };
            
         /**
          * 递归循环检测模块依赖
          * @param fdeps   依赖
          * @param startModule 起点模块
          * @param currentModule 当前模块
          * @param single 缓存队列
          * @param pidObj 缓存对象检测死循环
          */
         method.forDeps = function(fdeps,startModule,currentModule,single,pidObj,pid) {
              if (typeof(fdeps) !== 'undefined' && fdeps.length > 0) { 
                  if (defsBool) {return;} //跳出递归
                  for (var x in fdeps) {
                     if (defsBool) {break;}; //跳出循环
                     var depModule = fdeps[x],
                         id  = method.randomNum('m'), 
                         module = moduleCache[depModule],
                         ffdeps = module.deps;

                         pidObj[id] = {
                              name : depModule,     
                              id : id, 
                              pid : pid
                         };

                         single[depModule] = {        
                             name : depModule,
                             deps : ffdeps,
                             state : 0,
                             exports : {}
                         };

                         //判断检测依赖树单链死循环 
                         method.infiniteLoops(id,pidObj,depModule,nestedLevel,depModule);

                         if (defsBool) {
                               if (typeof(console) !== 'undefined') {
                                  console.log('加载完'+currentModule+'模块，检查依赖出现循环依赖，停止依赖解析,该模块运行失败！');
                               } else {
                                  alert('加载完'+currentModule+'模块，检测依赖出现循环依赖，停止依赖解析,该模块运行失败！');
                               }
                               break;
                         } else {
                              method.forDeps(ffdeps,startModule,currentModule,single,pidObj,id); 
                         }
                    }
             }
         };

     /**********************加载器********************/
     var peas = {}; 
           
         //引入模块     
         peas.use = function(deps,callback,parentName) {
              var type = Object.prototype.toString.call(deps).slice(8, -1);
              if (type == 'Array') {
                  peas.useHandle(deps,callback,parentName);
              } else if (type == 'Function') {
                  peas.useHandle([],deps,parentName);
              } 
         } 
         
         peas.useHandle = function(deps,callback,parentName) {
             var name = parentName || deps.join( '_' ) + '_' + ( +new Date() ) + ( Math.random() + '' ).slice(-8);
             //合并require方式引入的模块
             deps = peas.requireDeps(callback,deps);
             //判断初始模块使用 
             if (typeof(parentName)  == 'undefined') {
                
                 var id = method.randomNum('m');

                 if (debug) {
                     moduleTemp = {};
                     moduleCache = {};
                 }

                 //建立依赖起点   
                 moduleTemp[name] = {
                     uid : id,
                    name : name,
                    deps : deps,
                    fordeps : {}
                 }

                 //use 本身也是一个模块，没有名称而已,随机生成的,建立模块队列
                 moduleCache[name] = {
                       name : name,
                       callback : callback,
                       state : 1,
                       deps : deps
                 };

             } 
             
             //加载文件 
             method.load(name);
         };

         peas.require = function(moduleName){
             //return exports[moduleName];
             //return 'test';
         };

         //匹配依赖 
         peas.requireDeps = function(callback,deps) {
             var str = callback.toString(),
                 arr = [],
                 patten = new RegExp(/peas.require\(['|"]([\w|\\|\/]+)['|"]\)/gi),
                 result = patten.exec(str);
                 while (result != null) {
                     arr.push(RegExp.$1);
                     result = patten.exec(str);
                 }
             if (typeof(deps) == 'undefined') {
                 deps = [];
             }
             return arr.concat(deps);          
        };
     
     /*********************外部接口*******************/
     /**
      * define 模块方法
      * @param name 模块名
      * @param deps 模块依赖关系
      * @param callback 模块回调函数
      */
     win.define = function(name,deps,callback) {
          //判断是否继续执行依赖模块 
          //console.log('defined',name);
          if (!defsBool) {
             moduleCache[name].callback = callback,
             moduleCache[name].deps = deps;
             moduleCache[name].state = 1;
             if (deps.length > 0) {
                  peas.use(deps,callback,name);
             }
             //检测依赖，执行回调函数
             method.checkDeps(name);
          }
     }
     //peas对外接口
     win.peas = peas;
})(window)
