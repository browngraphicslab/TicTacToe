import * as React from "react";
import * as ReactDOM from "react-dom";
import AdvancedBoard from "../solution/components/advanced_board";

ReactDOM.render((
    <AdvancedBoard
        background={"#003"}
        minimumDimensions={3}
        maximumDimensions={15}
    />
), document.getElementById("root"));