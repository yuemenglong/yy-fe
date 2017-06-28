var React = require("react");
var ev = require("yy-fe/ev");
require("./style.less");
var NavPopup = require("./component/NavPopup")

function FirstClass() {
    this.getInitialState = function() {
        return { navHover: null }
    }
    this.renderHeaderPopup = function() {
        return jade(`NavPopup(navHover={this.state.navHover})`)
    }
    this.onNavMouseOver = function(i) {
        this.setState({ navHover: i })
    }
    this.onNavMouseOut = function() {
        this.setState({ navHover: null })
    }
    this.renderNavs = function() {
        var navs = ["机构", "机构", "机构", "机构", "机构", "机构", "机构"]
        return jade(`div(id="header-nav")`, navs.map(function(nav, i) {
            var props = {
                key: i,
                onMouseOver: this.onNavMouseOver.bind(null, i),
                onMouseOut: this.onNavMouseOut,
            }
            return jade(`span({...props}) {nav}`)
        }.bind(this)))
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
                div(id="header")
                    div(id="header-banner")
                    div(id="header-search")
                    |{this.renderNavs()}
            div(id="body")
                |{this.renderHeaderPopup()}
            `);
    }
}

module.exports = React.createClass(new FirstClass())
