import React from 'react'
import { UserRound } from 'lucide-react';

const Contact = (props) => {
    console.log(props)
  return (
    <div onClick={() => props.handleClick(props.c.email)} className={`flex flex-row p-3 rounded-2xl mx-1 ${props.isActive?"bg-slate-700":""} hover:bg-slate-700 cursor-pointer
`}>
        <div className='bg-slate-300 rounded-full w-12 h-12 mr-4'>
            {/* <img src={props}/> */}
        </div>
        <div>
            <div className='text-white font-bold'>
                {props.c.name}
            </div>
            <div className='text-gray-400 text-xs'>
                hi Adnan...
            </div>
        </div>
    </div>
  )
}

export default Contact