var React = require("react")
require("./style.less")

function NavPopup() {
    this.getDefaultProps = function() {
        return { navHover: null }
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
        var c1 = jade(`
        ul(className="column")
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            li 厅总规划师
            `)
        return [c1, c1, c1]
    }
    this.render = function() {
        // if (this.props.navHover == null) {
        //     return jade(`div(id="header-line")`)
        // } else {
        return jade(`
            div(id="header-popup" onMouseOut={this.onNavMouseOut})
                div(className="left")
                    div(className="popup-header") 厅领导
                    |{this.renderLeaders()}
                div(className="right")
                    div(className="popup-header") 机关处室 厅直属单位
                    |{this.renderDepartment()}
            `)
            // }
    }
}


module.exports = React.createClass(new NavPopup())
