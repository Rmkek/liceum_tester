import React, { Component } from 'react'
import TeacherNavBar from './TeacherNavBar'
import Spinner from '../../Reusables/Spinner/Spinner'
import { Redirect } from 'react-router-dom'
import Footer from '../../Reusables/Footer/Footer'

class TeacherPage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      redirected: false,
      is_loading: true
    }

    console.log('href: ', window.location.href)

    window.fetch(window.location.href, {
      credentials: 'include',
      method: 'POST'
    })
      .then(res => {
        if (res.redirected) {
          this.setState({redirected: true, is_loading: false})
        } else {
          console.log('in else')
          this.setState({is_loading: false})
        }
        console.log('in teacherpage response: ', res)
      })
      .catch(err => {
        console.log('err: ', err)
      })
  }

  render () {
    if (this.state.redirected) {
      return <Redirect to='/' />
    }

    return this.state.is_loading ? <Spinner /> : <div>
      <TeacherNavBar />
      {this.props.component}
      <Footer />
    </div>
  }
}

export default TeacherPage
