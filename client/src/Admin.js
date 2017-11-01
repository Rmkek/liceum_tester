import React, {Component} from 'react';
import {Table} from 'react-bootstrap';

class Admin extends Component {
    constructor() {
        super()
        fetch(`admin`, {
            accept: "application/json"
          })
          .then((response) => {
            console.log(response)
          })
    }

    render() {
        return (
    <Table striped bordered condensed hover style={this.style}>
    </Table>
    )
  }
}

export default Admin;
