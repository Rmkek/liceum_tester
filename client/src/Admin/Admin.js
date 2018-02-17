import React, { Component } from "react";
import { Table, Button } from "reactstrap";
import "./Admin.css";

let keyIter = 0;

class Admin extends Component {
  constructor() {
    super();
    fetch(`api/getNotApprovedUsers`, {
      accept: "application/json",
      credentials: "include"
    })
      .then(response => response.json())
      .then(resp => {
        let users = [];
        resp.success.forEach(element => {
          users.push(this.renderTableRow(element.email));
        }, this);
        this.setState({ table_body: users });
      });

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      table_body: <tr />,
      users_in_table: 0
    };
  }

  handleChange = event => {
    for (let i = 0; i < this.state.table_body.length; i++) {
      let each = this.state.table_body[i];
      if (each.key === event.target.getAttribute("index")) {
        let email = each.props.children[1].props.children;

        fetch(`api/approveUser?email=${email}`, {
          accept: "application/json",
          credentials: "include"
        }).then(response => {
          if (response.status >= 200 && response.status < 300) {
            this.state.table_body.splice(i, 1);
            this.setState({
              users_in_table: --this.state.users_in_table
            });
            this.setState({ table_body: this.state.table_body });
          }
        });
      }
    }
  };

  renderTableRow = email => {
    this.setState({
      users_in_table: ++this.state.users_in_table
    });
    ++keyIter;
    console.log(keyIter);
    return (
      <tr key={keyIter}>
        <td>{this.state.users_in_table}</td>
        <td>{email}</td>
        <td>
          <Button onClick={this.handleChange} index={keyIter}>
            {" "}
            Approve{" "}
          </Button>
        </td>
      </tr>
    );
  };

  render() {
    return (
      <Table bordered hover>
        <thead>
          <tr>
            <th>№</th>
            <th>E-mail</th>
            <th>Approve</th>
          </tr>
        </thead>
        <tbody>{this.state.table_body}</tbody>
      </Table>
    );
  }
}

export default Admin;
