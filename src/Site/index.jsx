var React = require("react");
var ev = require("yy-fe/ev");
require("./style.less");
var Navs = require("./component/Navs")

function SiteClass() {
    this.getInitialState = function() {
        return { navHover: null }
    }
    this.render = function() {
        return jade(`
        div
            div(id="top") 
                div(id="top-bar")
                    div(id="top-bar-in")
                        div(className="left")
                            div 返回网站首页
                            div 河南人民政府
                            div 中国交通运输部
                        div(className="right")
                            span 微门户
                            span 微信公众号
                            span rss 订阅
                            span 无障碍版
                div(className="header")
                    div(className="header-banner")
                    Navs
            div(className="body")
            `);
    }
}

module.exports = React.createClass(new SiteClass())
