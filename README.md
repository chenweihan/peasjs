peasjs
======
简介：

peasjs 是一个js以模块方式开发的模块加载器小型框架。

---
## 使用方法:

     /**
      *  模块同时依赖 a,b   b是require方式引入的
      */
     peas.use(['a'],function(exports){
        peas.require('b');
        console.log(exports);
        return 'success!';
     });

     /**
      *  模块c同时依赖b，c,但b, 同时依赖a,e
      */
     peas.use(function(exports){
        peas.require('c');
        console.log(exports);
        return 'success!';
     });

**注：** 更多使用请下载demo,console调试查看。


## 完善了海量jquery插件引入方式 具体见plug.html 

### 链接
项目主页：<https://github.com/chenweihan/peasjs>

### 需要完善
    nodejs压缩工具,组件机制(使用jquery组件机制，但需要完善组件依赖载入),第三方库的快捷使用,融入页面模块,模板引擎,完善兼容性。

