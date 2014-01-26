/**
 * Created with Vim7.3 Ubuntu10.04
 * @fileOverview : jquery 点击飞入的特效  
 * @author : Chen weihan <csq-3@163.com>
 * @since : 2013年10月29日 星期二 16时09分02秒
 * @filename : js/component/jquery.fly.js
 * @version : v1.0 
 * @description :  目前是一个基础版，只实现类似购物车的特效，点击物品，飞入购物车。
 */

//闭包
;(function($) {

    /******************************************固定模块***********************************
     * 默认参数选项设置
     */
    var defaults = {    
           tid : '',    
           speed : 'slow'
    };

    /******************************************固定模块**********************************
     * 字面量方法对象 
     */ 
    var methods = {        
        
        //当前操作的对象 
        dom : {},
        
        opts : {},

        init : function(opts,dom) {
            this.dom = dom;
            this.opts = opts;
            this.bindEvt();
        },

        bindEvt : function() {
           
            var tthis = this;
           
            $(this.dom).live('click',function(){
                tthis.fly(this);
            })

        },
        
        fly : function(that) {
                  
            var params={},
                tmpDom = $(that).clone(true),
                fidXY = $(that).offset(),
                tidXY = $('#'+this.opts.tid).offset();

                tmpDom = tmpDom.css({
                     'position':'absolute',
                     'z-index':9999,
                     'top' : fidXY.top,
                     'left' : fidXY.left
                });

                $('body').append(tmpDom);
                params = $.extend({},tidXY,{height:20,width:20,opacity:0});
                $(tmpDom).animate(params, this.opts.speed ,function(){
                      tmpDom.remove();  
                });

        } 
    };
       
    /*****************************************固定模块***********************************
     *  jquery fly插件
     */
    $.fn.fly = function(options){
        //合并配置对象,赋值this对应的dom为dom变量
        var dom = this;
            opts = $.extend({}, defaults, options || {});
            if (opts.tid !== '') {
                methods.init(opts,dom);
            }
         
         //保持链式调用,如果重新赋值对象内部的子对象进行了非引用修改，需要返回修改后的对象
         return $(this);
    }; 
})($);

