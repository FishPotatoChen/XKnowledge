function highlight(chartInstance, dataIndex, dataType) {
    // 高亮，根据数据类型和位置来高亮
    chartInstance.dispatchAction({
        type: "highlight",
        seriesIndex: 0,
        dataType: dataType,
        dataIndex: dataIndex
    });
}

function downplayByName(chartInstance, name) {
    // 解除节点高亮，有时节点无法知道自己的index
    chartInstance.dispatchAction({
        type: "downplay",
        seriesIndex: 0,
        dataType: "node",
        name: name
    });
}

function downplay(chartInstance, dataIndex, dataType) {
    // 解除高亮，根据数据类型和位置来解除
    chartInstance.dispatchAction({
        type: "downplay",
        seriesIndex: 0,
        dataType: dataType,
        dataIndex: dataIndex
    });
}

function downplayAll(chartInstance, highlightNodeList) {
    // 解除全部节点的高亮
    for (let i = 0; i < highlightNodeList.length; i++) {
        downplayByName(chartInstance, highlightNodeList[i]);
    }
}

function sendData(formData, chart) {
    // 发送数据到后端
    if (chart === undefined) {
        fetch("{{ url_for('XKnowledge.XKMainView') }}", {
            method: "POST",
            body: formData // 将FormData对象作为请求体发送
        });
    } else {
        fetch("{{ url_for('XKnowledge.XKMainView') }}", {
            method: "POST",
            body: formData // 将FormData对象作为请求体发送
        }).then(response => {
            return response.json();
        }).then(data => {
            chart.setOption(createOption(data));
        });
    }
}

function createOption(jsonData) {
    let option = {
        // 图的标题
        title: {
            text: jsonData.title
        },
        // 提示框的配置
        tooltip: {
            formatter: function (x) {
                return x.data.des;
            }
        },
        // 工具箱
        toolbox: {
            // 显示工具箱
            show: true,
            feature: {
                mark: {
                    show: true
                },
                // 还原
                restore: {
                    show: true
                },
                // 保存为图片
                saveAsImage: {
                    show: true
                }
            }
        },
        legend: [{
            // selectedMode: "single",
            data: jsonData.categories.map(function (a) {
                return a.name;
            })
        }],
        graphic: [
            {
                type: "text",
                left: "center",
                bottom: "5%",
                style: {
                    fill: "rgba(0,0,0,1)",
                    text: "By XKnowledge",
                    font: "bold 18px sans-serif"
                }
            }
        ],
        series: [{
            type: "graph", // 类型:关系图
            layout: "force", //图的布局，类型为力导图
            //symbolSize: 40, // 调整节点的大小
            roam: true, // 是否开启鼠标缩放和平移漫游。默认不开启。如果只想要开启缩放或者平移,可以设置成 "scale" 或者 "move"。设置成 true 为都开启
            // edgeSymbol: ["circle", "arrow"],
            //edgeSymbolSize: [2, 10],
            //edgeLabel: {
            //    normal: {
            //        textStyle: {
            //            fontSize: 20
            //        }
            //    }
            //},
            force: {
                repulsion: 2500,
                edgeLength: [10, 50]
            },
            draggable: true, // 元素是否可以被拖动
            // 边的风格
            lineStyle: {
                normal: {
                    width: 2,
                    color: "#4b565b",
                }
            },
            // 边上显示当前边的名称
            edgeLabel: {
                normal: {
                    show: true,
                    formatter: function (x) {
                        return x.data.name;
                    }
                }
            },
            // 节点上显示当前节点名称
            label: {
                normal: {
                    show: true,
                    textStyle: {}
                }
            },
            // 高亮时节点外层增加黑色边缘
            emphasis: {
                disable: true,
                itemStyle: {
                    borderColor: "#000",
                    borderWidth: 2,
                    borderType: "solid"
                },
                lineStyle: {
                    color: "#000",
                    width: 5,
                }
            },
            // 数据
            data: jsonData.data,
            links: jsonData.links,
            categories: jsonData.categories,
        }]
    };
    return option;
}

class HighlightClass {
    constructor() {
        this.highlightNodeList = []; // 记录旧的高亮节点
        this.highlightEdge = undefined;
    }

    addNode(chartInstance, name, dataIndex) {
        const pos = this.highlightNodeList.indexOf(name);
        if (pos !== -1 && this.highlightNodeList.length !== 0) {
            // 当重复点击节点的时候，将节点高亮去掉，并且更新highlightNodeList
            if (this.highlightNodeList.length === 1) {
                downplay(chartInstance, dataIndex, "node");
                this.highlightNodeList = [];
            } else {
                downplay(chartInstance, dataIndex, "node");
                this.highlightNodeList = [this.highlightNodeList[(pos + 1) % 2]];// 取pos对应的另一个节点
            }
        } else {
            if (this.highlightNodeList.length < 2) {
                // 点击第一个节点时，高亮点击的那个节点，点击第二个节点时，高亮新点击的节点
                this.highlightNodeList[this.highlightNodeList.length] = name;
                highlight(chartInstance, dataIndex, "node");
            } else {
                // 点击第三个节点时，将第一个节点高亮取消，并把第二个节点放到第一个位置上，为了后面的有向链接做准备
                downplayByName(chartInstance, this.highlightNodeList[0]);
                highlight(chartInstance, dataIndex, "node");
                this.highlightNodeList[0] = this.highlightNodeList[1];
                this.highlightNodeList[1] = name;

            }
            console.log(this.highlightNodeList);
        }
    }

    addEdge(chartInstance, data, dataIndex) {
        if (this.highlightEdge === undefined) {
            // 如果边没有初始化，就初始化
            this.highlightEdge = {data: data, dataIndex: dataIndex};
        } else {
            // 如果边初始化了，就将旧的边解除高亮
            downplay(chartInstance, this.highlightEdge.dataIndex, "edge");
            this.highlightEdge = {data: data, dataIndex: dataIndex};
        }
        highlight(chartInstance, dataIndex, "edge");
    }

    reset(chartInstance) {
        downplayAll(chartInstance, this.highlightNodeList);
        this.highlightNodeList = [];
        if (this.highlightEdge !== undefined) {
            downplay(chartInstance, this.highlightEdge.dataIndex, "edge");
        }
        this.highlightEdge = undefined;
    }

    resetNode(chartInstance) {
        downplayAll(chartInstance, this.highlightNodeList);
        this.highlightNodeList = [];
    }

    resetEdge(chartInstance) {
        if (this.highlightEdge !== undefined) {
            downplay(chartInstance, this.highlightEdge.dataIndex, "edge");
            this.highlightEdge = undefined;
        }
    }
}