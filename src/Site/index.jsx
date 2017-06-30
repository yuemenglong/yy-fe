var React = require("react");
var _ = require("lodash");
var ev = require("yy-fe/ev");
require("./style.less");
var Navs = require("./component/Navs")
var NavTab = require("./element/NavTab")

function SiteClass() {
    this.getInitialState = function() {
        return { navHover: null }
    }
    this.renderGZDT = function() {
        return _.times(8).map(function(o, i) {
            return jade(`
            li(key={i}) 
                span(className="left") 李小鹏部长来豫调研 部省合力久久为功为经力久久为
                span(className="right") 2017-05-24
                `)
        })
    }
    this.renderTZGG = function() {
        var header = jade(`div 通知公告`)
        var body = jade("ul", function() {
            return _.times(6).map(function(o, i) {
                return jade(`
                li(key={i})
                    span(className="left") 河南省交通运输厅关于印发2017年度全省推进交通运输进交通运输
                    span(className="right") 2017-06-27`)
            })
        })
        return jade(`NavTab(className="left" header={[header, header]} body={[body, body]})`)
    }
    this.renderWSCYZ = function() {
        var header = jade(`div 我是从业者`);
        var body = jade("ul", function() {
            return _.times(6).map(function(o, i) {
                return jade(`
                li(key={i})
                    img(src="http://www.hncd.gov.cn/portal/lib/jttnew/images/hyfzicon2_01.gif")
                    div 行政审批大厅`)
            })
        })
        return jade(`NavTab(className="right" header={[header, header]} body={[body, body]})`)
    }
    this.renderImgLinks = function() {
        return _.times(5).map(function(o, i) {
            return jade(`img(key={i} src="http://www.hncd.gov.cn/portal/rootimages/2015/01/09/1420765832581498.jpg")`)
        })
    }
    this.renderBSFW = function() {
        var header = "办事服务";
        var buttons = jade(`ul(key="bsff")`, function() {
            return _.times(4).map(function(o, i) {
                return jade(`
                li(key={i})
                    span {">>"}
                    button 办事指南`)
            })
        });
        var body = [buttons, this.renderXGFW()]
        return jade(`NavTab(className="left" header={[header,header]} body={[body,body]})`)
    }
    this.renderXGFW = function() {
        var items = ["行政审批大厅", "问题解答", "下载中心", "行政许可公示", "行政处罚公示"].map(function(item, i) {
            return jade("li(key={i}) {item}")
        })
        return jade(`
        div(key="xgfw" className="xgfw")
            div(className="float") 相关服务
            ul
                |{items}
            `)
    }
    this.renderZXFT = function() {
        var header = "在线访谈";
        var body = [
            jade(`img(key="img" src="http://www.hncd.gov.cn/portal/rootimages/2017/05/27/1495848788161956.jpg")`),
            jade(`p(key="p1") 主题： 厅总规划师张宏做客河南政府网“在线访谈”栏目，介绍我省交通运输发展情况`),
            jade(`p(key="p2") 主题： 厅总规划师张宏做客河南政府网“在线访谈”栏目，介绍我省交通运输发展情况`),
        ]
        return jade(`NavTab(className="right" header={[header, header]} body={[body,body]})`)
    }
    this.renderSelects = function() {
        return _.times(5).map(function(item, i) {
            return jade(`select(key={i})`, function() {
                return ["+---------厅直属单位----------+"].map(function(v, i) {
                    return jade(`option(value={i} key={i}) {v}`)
                })
            })
        });
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
            div(id="body")
                div(className="row1")
                    div(className="left")
                    div(className="right")
                        div(className="header")
                            span(className="left") 工作动态
                            span(className="right") 更多 >>
                        ul(className="list")
                            |{this.renderGZDT()}
                div(className="row2")
                    |{this.renderTZGG()}
                    |{this.renderWSCYZ()}
                div(className="row3")
                    |{this.renderImgLinks()}
                div(className="row4")
                    |{this.renderBSFW()}
                    |{this.renderZXFT()}
            div(id="footer")
                div(className="inner")
                    div(className="row1")
                        |{this.renderSelects()}
                    div(className="row2")
                        img(src="http://dcs.conac.cn/image/red.png")
                        ul
                            li 网站纠错
                            li 网站地图
                        ul
                            li 主办：河南省交通运输厅 制作维护：河南省交通通信中心
                            li 豫ICP备：12020435号 郑公备：41010029000286

            `);
    }
}

module.exports = React.createClass(new SiteClass())
