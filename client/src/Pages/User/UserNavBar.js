import React, { Component } from 'react'
import { Navbar, NavbarBrand, Nav, NavItem } from 'reactstrap'
import { Redirect } from 'react-router-dom'

class UserNavBar extends Component {
  constructor () {
    super()

    this.state = {
      redirected: false
    }
  }

  logout = (e) => {
    console.log('logging out...', e)

    window.fetch('/api/logout', {
      credentials: 'include',
      method: 'POST'
    })
      .then(() => {
        this.setState({redirected: true})
      })
      .catch(err => {
        console.log('err: ', err)
      })
  }

  render () {
    return this.state.redirected ? <Redirect to='/' /> : (
      <Navbar color='faded' light expand='md'>
        <NavbarBrand href='/assignments'>TestMyCode User Panel</NavbarBrand>
        <Nav className='ml-auto' navbar>
          <NavItem>
            <i className='fas fa-sign-out-alt logout-button' onClick={this.logout} />
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default UserNavBar
