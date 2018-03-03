import React, { Component } from "react";
import "./Footer.css";

class Footer extends Component {
  render() {
    return (
      <div className="footer">
        <p>
          Created with <i className="fas fa-heart heart" /> by
          <a className="footer__name-margin" href="mailto:malyshkov.roman@gmail.com?subject=Liceum Tester">
            Kirill Pavidlov
          </a>
        </p>
      </div>
    );
  }
}

export default Footer;
