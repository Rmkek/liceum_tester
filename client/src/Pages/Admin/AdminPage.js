import React, { Component } from 'react'
import AdminNavBar from './AdminNavBar'
import Spinner from '../../Reusables/Spinner/Spinner'
import {Redirect} from 'react-router-dom'

class AdminPage extends Component {
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
        console.log('in adminpage response: ', res)
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
      <AdminNavBar />
      {this.props.component}
    </div>
  }
}

export default AdminPage
