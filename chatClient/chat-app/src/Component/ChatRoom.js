// src/ChatApp.js
import React, { useState, useEffect } from 'react';
import { connect, sendPublicMessage, sendPrivateMessage } from '../services/WebSocket';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import Layout from './Layout';
import style from '../styles/chatRoom.module.css'
import { FaArrowRight } from 'react-icons/fa';

import { setCurrentUser, clearCurrentUser } from '../redux/store';

const ChatApp = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const [publicMessages, setPublicMessages] = useState([]);
    const [privateMessages, setPrivateMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [privateRecipient, setPrivateRecipient] = useState('');
    const [UserDetail, SetUserDetail] = useState([]);
    const [id, setId] = useState();
    const [previousChat, setPreviousChat] = useState([]);
    const [msgSend, setMsgSend] = useState(false);
    const CurrentUser = location.state;
    const navigate = useNavigate();
    const ContactName = useSelector(state => state.userName.user);


    console.log("Data:" + CurrentUser);

    useEffect(() => {
        const fetchDataAndConnect = async () => {

            const response = await axios.get("http://localhost:8081/api/getData");
            console.log("userData:" + response.data);
            SetUserDetail(response.data);
            const user = response.data.filter(user => user.user_name === CurrentUser)[0];
            dispatch(setCurrentUser({ user: user.user_name, id: user.user_id }));
            setId(user.user_id);
            const logInResponse = await axios.put(`http://localhost:8081/api/userLogInStatus/${user.user_id}`);
            console.log(logInResponse);
            const webSocketConnection = connect(
                CurrentUser,
                (msg) => setPublicMessages((prev) => [...prev, msg]),
                (msg) => setPrivateMessages((prev) => [...prev, msg])
            );



            // Cleanup function to close WebSocket on component unmount
            return () => {
                if (webSocketConnection && typeof webSocketConnection.close === 'function') {
                    webSocketConnection.close();
                }
            };
        };

        fetchDataAndConnect();
    }, [CurrentUser]);



    const handlePublicMessageSend = () => {
        sendPublicMessage({ senderName: CurrentUser, message });
        setMessage('');
    };

    const handlePrivateMessageSend = () => {
        const newMessage = {
            senderName: CurrentUser,
            receiverName: ContactName,
            message,
        };

        // Send the private message
        sendPrivateMessage(newMessage);

        setPrivateMessages((prev) => [...prev, newMessage]);


        // Clear the message input
        setMessage('');

    };
    const getMessage = async () => {
        const messageResponse = await axios.post(`http://localhost:8081/api/user-connected/${CurrentUser}`); //TO get the offline messages
        console.log("New messages" + messageResponse.data);
        if (messageResponse.data) {
            // Assuming the data is in the expected format
            messageResponse.data.forEach((msg) => {
                setPrivateMessages((prev) => [...prev, msg]);
            });
        }
    }
    useEffect(() => {
        const fetchPreviousChatsForContact = async () => {
            const PreviousMsg = await axios.get(`http://localhost:8081/api/getChatHistory/${CurrentUser}`);
            if (ContactName) {
                setPreviousChat(PreviousMsg.data.filter(data => data.receiverName === ContactName || data.senderName === ContactName));
            }
        };
        setPrivateMessages(privateMessages.filter(data => data.receiverName === ContactName || data.senderName === ContactName));


        fetchPreviousChatsForContact();
    }, [ContactName, CurrentUser]);


    return (
        <div className='mainCont'>
            <Layout userDetail={UserDetail} />

            <div className={style.chatCont}>
                <div className={style.header}></div>

                {/* <h1>Chat App</h1>
            
                <h2>{CurrentUser}</h2> */}
                {/* <h2>Public Chat</h2> */}

                {/* <div>

                    {publicMessages.map((msg, index) => (
                        <div key={index}>{`${msg.senderName}: ${msg.message}`}</div>
                    ))}
                </div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={handlePublicMessageSend}>Send Public Message</button> */}





                <div className={style.msgCont}>
                    {previousChat.map((msg, index) => (
                        msg.senderName == CurrentUser ? (
                            <div key={index} className={style.senderOutCont}>
                                <div className={style.senderBox}>{msg.message}</div>
                            </div>

                        ) : (

                            //< div key={index} > {`${msg.senderName} to ${msg.receiverName}: ${msg.message}`}</div>)
                            <div key={index} className={style.receiverOutCont}>
                                <div className={style.receiverBox}>{msg.message}</div>
                            </div>
                        )
                    ))}

                    {/* <div>{`${CurrentUser} to ${privateRecipient}: ${message}`}</div> */}

                    {privateMessages.map((msg, index) => (
                        msg.senderName == CurrentUser ? (
                            <div key={index} className={style.senderOutCont}>
                                <div className={style.senderBox}>{msg.message}</div>
                            </div>

                        ) : (

                            //< div key={index} > {`${msg.senderName} to ${msg.receiverName}: ${msg.message}`}</div>)
                            <div key={index} className={style.receiverOutCont}>
                                <div className={style.receiverBox}>{msg.message}</div>
                            </div>
                        )
                    ))}
                </div>

                <div className={style.sendMsgCont}>
                    <div className={style.msgInput}>
                        <input
                            type="text"
                            placeholder='Type a message here'
                            value={message}
                            className={style.inputBox}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <div onClick={handlePrivateMessageSend} className={style.sendMsgBtn}><FaArrowRight /></div>
                    </div>
                </div>

                {/* <div>  <button onClick={getMessage}>Get Message</button>   </div>*/}


            </div>
        </div >

    );
};

export default ChatApp;