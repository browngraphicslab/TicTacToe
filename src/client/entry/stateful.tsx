import Board from "../stencil/components/board";
import * as React from "react";
import * as ReactDOM from "react-dom";
import SmartBoard from "../solution/components/stateful_board";

ReactDOM.render(<SmartBoard background={"#003"} />, document.getElementById("root"));