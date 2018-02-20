import React, { Component } from "react";
import Footer from "../Footer/Footer";

class PageContainer extends Component {
  render() {
    return (
      <div>
        {this.props.component}
        <Footer />
      </div>
    );
  }
}

export default PageContainer;
