function getNodeValue(node) {
    return node.arguments[0].value;
}

function setNodeValue(node, value) {
    node.arguments[0].value = value;
}

function replaceNode(node, content) {
    node.type = "Literal";
    node.value = content;
    node.raw = `"${content}"`;
}

function clearNode(node) {
    while (node.$parent) {
        node = node.$parent;
        if (node.type == "VariableDeclaration" ||
            node.type == "ExpressionStatement") {
            node.type = "ExpressionStatement";
            node.expression = { type: "Identifier", name: "" };
            return;
        }
    }
    throw new Error("Can't Find Node Parent Which Can Clear");
}

module.exports = { getNodeValue, setNodeValue, replaceNode, clearNode }
