import React, { Component } from "react";
import "./Footer.css";

class Footer extends Component {
  render() {
    return (
      <div className="footer">
        <p>
          Created with <i className="fas fa-heart heart" /> by
          <a className="footer__name-margin" href="https://vk.com/rmk1337" rel="noopener noreferrer" target="_blank">
            Kirill Pavidlov
          </a>
        </p>
      </div>
    );
  }
}

export default Footer;
