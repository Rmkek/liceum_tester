import React, { Component } from 'react';

class Assignments extends Component {
    style = {
        position: 'absolute',
        color: 'white'
    }

    render() {
        return (
            <div style={this.style}>
                <h1>Here goes your assignments!</h1>
            </div>
        )
  }
}

export default Assignments;
