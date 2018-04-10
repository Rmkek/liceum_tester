import React, { Component } from 'react'
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap'

class TeacherNavBar extends Component {
  render () {
    return (
      <Navbar color='faded' light expand='md'>
        <NavbarBrand href='/teacher'>Liceum Tester Teacher Panel</NavbarBrand>
        <Nav className='ml-auto' navbar>
          <NavItem>
            <NavLink href='/teacher'>My Profile</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/my-students'>My Students</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/categories'>My Assignments</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href='/teacher/add-assignments/'>Add Assignments</NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default TeacherNavBar
