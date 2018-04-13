import React, { Component } from 'react'
import Categories from '../../../Reusables/Categories/Categories'
import './Assignments.css'
import UserNavBar from '../UserNavBar'
import { Redirect } from 'react-router-dom'

class Assignments extends Component {
  constructor () {
    super()

    this.state = {
      assignments: '',
      keyIter: -1,
      assignments_json: {},
      full_name: '',
      redirect: false,
      redirect_url: ''
    }
    window.fetch('/api/get-info', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      method: 'POST'
    }).then(response => {
      console.log(response)
      if (response.redirected) {
        this.setState({
          redirect_url: response.url.substring(response.url.lastIndexOf('/'), response.url.length),
          redirect: true
        })
      } else {
        response.json().then(json => {
          this.setState({
            full_name: json.name,
            categories: json.categories
          })
        })
      }
    })
  }

  render () {
    if (this.state.redirect) {
      return (
        <Redirect
          to={{
            pathname: this.state.redirect_url
          }}
        />
      )
    }
    return (
      <div>
        <UserNavBar />
        <Categories categories={this.state.categories} full_name={this.state.full_name} isTeacher={false} />
      </div>
    )
  }
}

export default Assignments
