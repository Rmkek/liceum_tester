import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Table, Button, FormGroup, Badge, Input, Label } from 'reactstrap'
import * as CODE_TESTING_CONSTANTS from '../../../../Backend_answers/CodeTestingConstants'
import './Assignment.css'

class Assignment extends Component {
  constructor (props) {
    super(props)

    this.state = {
      file: undefined,
      assignment: this.props.assignment
    }
  }

  // static getDerivedStateFromProps (nextProps, prevState) {
  //   console.log('nextprops', nextProps)
  //   if (nextProps.assignment === '') {
  //     return {
  //       file: undefined,
  //       assignment: ''
  //     }
  //   } else {
  //     return {
  //       file: undefined,
  //       assignment: nextProps.assignment
  //     }
  //   }
  // }

  onSendClick = (id, assignmentName) => {
    if (this.state.file === undefined) {
      return
    }

    let data = new window.FormData()

    data.append('codeFile', this.state.file)
    data.append('assignmentPackName', assignmentName)
    data.append('assignmentID', id)
    let property = {...this.state.assignment}

    ReactDOM.render(<Badge color='info'>Tests running...</Badge>, document.getElementById(`tests_status-${id}`).firstChild)
    window.fetch(`/api/upload-code`, {
      Accept: 'application/json',
      method: 'POST',
      credentials: 'include',
      body: data
    })
      .then(resp => resp.json())
      .then(json => {
        if (json.error === 'TESTS_FAILED') {
          ReactDOM.render(<Badge color='warning'>Tests failed on test {json.on_test}</Badge>, document.getElementById(`tests_status-${id}`).firstChild)
        } else {
          switch (json) {
            case CODE_TESTING_CONSTANTS.TESTS_PASSED:
              property.tasks.forEach(e => {
                if (e.id === id) {
                  e.solved = true
                }
              })
              this.setState({assignment: property})
              break
            case CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED:
              ReactDOM.render(<Badge color='warning'>No files were uploaded.</Badge>, document.getElementById(`tests_status-${id}`).firstChild)
              break
            default:
              ReactDOM.render(<Badge color='warning'>No files were uploaded.</Badge>, document.getElementById(`tests_status-${id}`).firstChild)
              console.log('Default case happened (this is bad probably)')
          }
        }
      })
  }

  handleFileChange = (e) => {
    this.setState({file: e[0]})
  }

  render () {
    console.log('state in render: ', this.state)
    return <Table bordered hover>
      <thead>
        <tr>
          <th>Assignment</th>
          <th>Send solution</th>
          <th>Tests</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        {this.state.assignment.tasks === undefined ? <tr><td>None</td></tr> : this.state.assignment.tasks.map(element => (
          <tr key={element.name}>
            <th scope='row'>{element.name}</th>
            {element.solved ? <td><p>Tests passed!</p></td>
              : <td>
                <form action='/api/upload-code' method='POST' encType='multipart/form-data'>
                  <FormGroup>
                    <Label for='upload__file-input'>Source code</Label>
                    <Input id='upload__file-input' className='upload__file' type='file' onChange={e => this.handleFileChange(e.target.files)} name='sampleFile' />
                    <Button className='button--send' id={element.id} onClick={(e) => this.onSendClick(element.id, this.state.assignment.name)}>
                      Submit
                    </Button>
                  </FormGroup>
                </form>
              </td>
            }
            <td id={`tests_status-${element.id}`}>
              {element.solved === true ? <Badge color='success'>Solved</Badge> : <p>Not solved</p>}
            </td>
            <td>
              <a href={this.state.assignment.pdfPath} target='_blank' rel='noopener noreferrer'>
                Click me!
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  }
}

export default Assignment
