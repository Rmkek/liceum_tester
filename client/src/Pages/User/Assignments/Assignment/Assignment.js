import React, { Component } from 'react'
import { Table, Button, FormGroup, Badge, Input, Label } from 'reactstrap'
import * as CODE_TESTING_CONSTANTS from '../../../../Backend_answers/CodeTestingConstants'
import './Assignment.css'

class Assignment extends Component {
  constructor (props) {
    super(props)

    this.state = {
      assignment_badge: 'Not solved.',
      file: undefined
    }
  }

  onSendClick = (id, assignmentName) => {
    if (this.state.file === undefined) {
      return
    }

    let data = new window.FormData()

    data.append('codeFile', this.state.file)
    data.append('assignmentPackName', assignmentName)
    data.append('assignmentID', id)
    this.setState({assignment_badge: <Badge color='info'>Tests running...</Badge>})
    window.fetch(`/api/upload-code`, {
      Accept: 'application/json',
      method: 'POST',
      credentials: 'include',
      body: data
    })
      .then(resp => resp.json())
      .then(json => {
        if (json.error === 'TESTS_FAILED') {
          this.setState({assignment_badge: <Badge color='warning'>Tests failed on test {json.on_test}</Badge>})
          console.log('state changed, ', this.state)
        } else {
          switch (json) {
            case CODE_TESTING_CONSTANTS.TESTS_PASSED:
              this.setState({assignment_badge: <Badge color='success'>Success</Badge>})
              break
            case CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED:
              this.setState({assignment_badge: <Badge color='warning'>No files were uploaded.</Badge>})
              break
            default:
              this.setState({assignment_badge: <Badge color='danger'>SERVER ERROR</Badge>})
              console.log('Default case happened (this is bad probably)')
          }
        }
      })
  }

  handleFileChange = (e) => {
    this.setState({file: e[0]})
  }

  render () {
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
        {this.props.assignment.tasks === undefined ? <tr><td>''</td></tr> : this.props.assignment.tasks.map(element => (
          <tr key={element.name}>
            <th scope='row'>{element.name}</th>
            {element.solved ? <td><p>Tests passed!</p></td>
              : <td>
                <form action='/api/upload-code' method='POST' encType='multipart/form-data'>
                  <FormGroup>
                    <Label for='upload__file-input'>Source code</Label>
                    <Input id='upload__file-input' className='upload__file' type='file' onChange={e => this.handleFileChange(e.target.files)} name='sampleFile' />
                    <Button className='button--send' id={element.id} onClick={(e) => this.onSendClick(element.id, this.props.assignment.name)}>
                      Submit
                    </Button>
                  </FormGroup>
                </form>
              </td>
            }
            <td id={`tests_status-${element.id}`}>
              {element.solved === true ? <Badge color='success'>Solved</Badge> : this.state.assignment_badge}
            </td>
            <td>
              <a href={this.props.assignment.pdfPath} target='_blank' rel='noopener noreferrer'>
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
