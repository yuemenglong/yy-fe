var React = require("react")
require("./style.less")

function NavPopup() {
    this.getInitialState = function() {
        return { show: null }
    }
    this.onMouseEnter = function(i) {
        this.setState({ show: i })
    }
    this.onMouseLeave = function() {
        this.setState({ show: null })
    }
    this.renderLeaders = function() {
        return jade(`
        ul(className="popup-detail")
            li(className="full") 厅长、党组书记：张琼
            li(className="part") 副厅长、党组成员： 刘兴彬
            li(className="part") 副厅长、党组成员：丁 平
            li(className="full") 省纪委驻厅纪检组长、党组成员：胡明柱
            li(className="full") 副厅长、党组成员：唐彦民
            li(className="full") 副厅长、党组成员：徐强
            li(className="full") 党组成员、运输局局长：高建立
            li(className="part") 行政执法局局长:魏金立
            li(className="part") 交战办主任： 李玉辉
            li(className="part") 厅副巡视员： 宋华东
            li(className="part") 厅副巡视员：尹如军
            `)
    }
    this.renderDepartment = function() {
        var col = function(key) {
            return jade(`
        ul(className="column" key={key})
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            `)
        }
        return [col(0), col(1), col(2)]
    }
    this.renderNavs = function() {
        var navsText = ["机构", "机构", "机构", "机构", "机构", "机构", "机构"]
        var navsElement = navsText.map(function(nav, i) {
            var props = {
                key: i,
                onMouseEnter: this.onMouseEnter.bind(null, i),
                onMouseLeave: this.onMouseLeave,
            }
            return jade(`span({...props}) {nav}`)
        }.bind(this));
        return navsElement;
    }
    this.renderPopup = function() {
        if (this.state.show == null) {
            return jade(`
            div(className="header-popup-container")
                div(id="header-line")`)
        } else {
            var props = {
                onMouseEnter: this.onMouseEnter.bind(null, this.state.show),
                onMouseLeave: this.onMouseLeave,
            }
            return jade(`
            div(className="header-popup-container" {...props})
                div(id="header-popup")
                    div(className="left")
                        div(className="popup-header") 厅领导
                        |{this.renderLeaders()}
                    div(className="right")
                        div(className="popup-header") 机关处室 厅直属单位
                        |{this.renderDepartment()}
                `)
        }
    }
    this.render = function() {
        return jade(`
        div(className="header-nav")
            |{this.renderNavs()}
            |{this.renderPopup()}
        `)
    }
}


module.exports = React.createClass(new NavPopup())
