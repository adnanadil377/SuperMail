import React from 'react'

const ContactManager = () => {
  return (
    <div className='text-white'>
        <form>
            <input placeholder='name'/>
            <input placeholder='email'/>
            <input placeholder='relation'/>
            <input placeholder='tone'/>
            <button>Create Contact</button>
        </form>
    </div>
  )
}

export default ContactManager