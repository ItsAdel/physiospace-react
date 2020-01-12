import React, { Component } from "react";
import { Avatar } from "antd";

class EmotionScale extends Component {
  state = { feedbackGiven: false };

  render() {
    return (
      <div>
        {" "}
        <Avatar
          onClick={this.props.function}
          size={100}
          style={{ backgroundColor: "#E4300A" }}
          icon="user"
        />{" "}
        <Avatar
          onClick={this.props.function}
          size={100}
          style={{ backgroundColor: "#f56a00" }}
          icon="user"
        />{" "}
        <Avatar
          onClick={this.props.function}
          size={100}
          style={{ backgroundColor: "#ECE50B" }}
          icon="user"
        />{" "}
        <Avatar
          onClick={this.props.function}
          size={100}
          style={{ backgroundColor: "#0CB404" }}
          icon="user"
        />
      </div>
    );
  }
}
export default EmotionScale;
