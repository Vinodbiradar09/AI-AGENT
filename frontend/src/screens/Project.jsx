import React from 'react';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user.context';
import Markdown from 'markdown-to-jsx';
import 'highlight.js/styles/github-dark.css';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { getWebContainer } from '../config/webContainers';

const SyntaxHighlightedCode = ({ className, children }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && className?.includes('lang-')) {
            hljs.highlightElement(ref.current);
        }
    }, [className, children]);

    return (
        <code
            ref={ref}
            className={`block overflow-x-auto p-4 rounded-md ${className || ''}`}
        >
            {children}
        </code>
    );
};

/**
 * WriteAiMessage component that renders AI responses from Savana
 * @param {string} message - JSON string containing the AI message data
 * @returns {JSX.Element} Rendered AI message
 */
const WriteAiMessage = ({ message }) => {
    try {
        // Parse the JSON message
        const messageObject = JSON.parse(message);

        // Check if the messageObject contains text property
        if (messageObject.text) {
            return (
                <div className="ai-message">
                    <div className="text-sm bg-slate-950 text-white rounded-sm p-2">
                        <Markdown options={{
                            overrides: {
                                code: {
                                    component: SyntaxHighlightedCode,
                                    props: { className: 'hljs' }
                                }
                            }
                        }}>
                            {messageObject.text}
                        </Markdown>
                    </div>

                    {/* If there's additional data like fileTree, render it */}
                    {messageObject.fileTree && (
                        <div className="file-structure mt-2 text-xs bg-slate-800 text-white p-2 rounded">
                            <h4 className="font-bold mb-1">File Structure:</h4>
                            <pre className="overflow-auto max-h-40">
                                {JSON.stringify(messageObject.fileTree, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        // Fallback if message doesn't have expected structure
        return <div className="ai-message-error text-red-500 text-sm">Unable to display AI message content</div>;
    } catch (error) {
        console.error("Failed to parse AI message:", error);
        return <div className="ai-message-error text-red-500 text-sm">Invalid message format</div>;
    }
};

const Project = () => {
    const location = useLocation();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState(location.state?.project || {});
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { user } = useContext(UserContext);
    const messageBoxRef = useRef(null);

    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);
    const [mobileView, setMobileView] = useState('chat'); // 'chat', 'code', or 'preview'

    // Automatically scroll to bottom when new messages arrive
    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [messages]);

    // Highlight.js initialization and cleanup
   useEffect(() => {
    // Register JavaScript and Plaintext languages for highlight.js
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('plaintext', plaintext);

    // Configure and apply highlighting
    hljs.configure({ ignoreUnescapedHTML: true });
    hljs.highlightAll();

    // Cleanup: unregister languages on unmount
    return () => {
      hljs.listLanguages().forEach(lang => hljs.unregisterLanguage(lang));
    };
  }, []);
    
    // Initialize socket and load project data
    useEffect(() => {
        // Safety check for location.state.project
        if (!location.state?.project?._id) {
            console.error("Project ID is missing");
            return;
        }

        initializeSocket(location.state.project._id);

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container);
                console.log("container started");
            }).catch(error => {
                console.error("Error starting web container:", error);
            });
        }

        receiveMessage('project-message', data => {
            try {
                if (!data || !data.newmessage) {
                    console.error("Received invalid message data:", data);
                    return;
                }
                
                const message = JSON.parse(data.newmessage);

                if (webContainer && message.fileTree) {
                    webContainer.mount(message.fileTree).catch(err => {
                        console.error("Error mounting file tree:", err);
                    });
                }
                
                if (message.fileTree) {
                    setFileTree(message.fileTree);
                }
                
                setMessages(prevMessages => [...prevMessages, data]);
            } catch (error) {
                console.error("Error processing received message:", error);
            }
        });

        // Load project data
        axios.get(`/projects/get-project/${location.state.project._id}`)
            .then((res) => {
                if (res.data && res.data.project) {
                    console.log("Project loaded:", res.data.project);
                    setProject(res.data.project);
                    
                    if (res.data.project.fileTree && typeof res.data.project.fileTree === 'object') {
                        setFileTree(res.data.project.fileTree);
                    }
                } else {
                    console.error("Invalid project data received:", res.data);
                }
            })
            .catch(err => {
                console.error("Error fetching project:", err);
            });

        // Load users
        axios.get('/users/all')
            .then((res) => {
                if (res.data && res.data.users) {
                    setUsers(res.data.users);
                } else {
                    console.error("Invalid users data received:", res.data);
                }
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });

    }, []);

    const handleUserClick = (id) => {
        setSelectedUserId(prev => new Set(prev).has(id)
            ? new Set([...prev].filter(i => i !== id))
            : new Set([...prev, id]));
    };

    function addCollaborators() {
        if (!location.state?.project?._id || !selectedUserId.size) {
            console.error("Missing projectId or no users selected");
            return;
        }
        
        axios.put('/projects/add-user', {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId),
        })
            .then((res) => {
                console.log("Collaborators added successfully:", res.data);
                setIsModalOpen(false);
                
                // Refresh project data to show updated collaborators
                return axios.get(`/projects/get-project/${location.state.project._id}`);
            })
            .then((res) => {
                if (res?.data?.project) {
                    setProject(res.data.project);
                }
            })
            .catch(error => {
                console.error("Error adding collaborators:", error);
            });
    }

    const send = () => {
        if (!message.trim()) return;

        const messageData = {
            newmessage: message,
            sender: user,
        };

        sendMessage('project-message', messageData);
        setMessages(prev => [...prev, messageData]);
        setMessage("");
    };

    function saveFileTree(ft) {
        if (!project?._id || !ft || typeof ft !== 'object') {
            console.error("Missing project ID or invalid file tree");
            return;
        }
        
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft,
        })
            .then(res => {
                console.log("File tree saved successfully:", res.data);
            })
            .catch(err => {
                console.error("Error saving file tree:", err);
            });
    }

// const runProject = async () => {
//   try {
//     if (!webContainer) {
//       console.error("WebContainer not initialized");
//       return;
//     }

//     // Guard: ensure fileTree is a non-empty object
//     if (!fileTree || typeof fileTree !== 'object' || Object.keys(fileTree).length === 0) {
//       console.error("Cannot run project: fileTree is empty or undefined");
//       return;
//     }

//     // Build nested file tree
//     const nestedTree = buildNestedFileTree(fileTree);

//     // Mount to the WebContainer
//     await webContainer.mount(nestedTree);

//     // Install dependencies
//     const installProcess = await webContainer.spawn("npm", ["install"]);
//     installProcess.output.pipeTo(new WritableStream({
//       write(chunk) { console.log(chunk); }
//     }));

//     // Kill any existing run
//     if (runProcess) {
//       runProcess.kill();
//     }

//     // Start the project
//     const tempRunProcess = await webContainer.spawn("npm", ["start"]);
//     tempRunProcess.output.pipeTo(new WritableStream({
//       write(chunk) { console.log(chunk); }
//     }));
//     setRunProcess(tempRunProcess);

//     // Listen for the server-ready event
//     webContainer.on('server-ready', (port, url) => {
//       console.log("Server ready on port:", port, "URL:", url);
//       setIframeUrl(url);

//       if (window.innerWidth < 768) setMobileView('preview');
//     });
//   } catch (error) {
//     console.error("Error running project:", error);
//   }
// };


    const MessageItem = ({ message, isOutgoing }) => (
        <div className={`message max-w-3/4 md:max-w-xs flex flex-col p-2 bg-slate-200 rounded-lg mb-2 ${isOutgoing ? 'ml-auto' : ''}`}>
            <small className='opacity-60 text-xs'>{message.sender?.email || 'Unknown'}</small>
            {message.sender?._id === 'savana' ? (
                <WriteAiMessage message={message.newmessage} />
            ) : (
                <p className="text-sm break-words">{message.newmessage}</p>
            )}
        </div>
    );

    // Render mobile navigation for switching between views
    const MobileNavigation = () => (
        <div className="md:hidden flex w-full bg-slate-800 text-white">
            <button 
                className={`flex-1 py-2 text-center ${mobileView === 'chat' ? 'bg-slate-600' : ''}`}
                onClick={() => setMobileView('chat')}
            >
                <i className="ri-message-3-line mr-1"></i> Chat
            </button>
            <button 
                className={`flex-1 py-2 text-center ${mobileView === 'code' ? 'bg-slate-600' : ''}`}
                onClick={() => setMobileView('code')}
            >
                <i className="ri-code-line mr-1"></i> Code
            </button>
            {iframeUrl && (
                <button 
                    className={`flex-1 py-2 text-center ${mobileView === 'preview' ? 'bg-slate-600' : ''}`}
                    onClick={() => setMobileView('preview')}
                >
                    <i className="ri-play-line mr-1"></i> Preview
                </button>
            )}
        </div>
    );

    return (
        <main className='h-screen w-screen flex flex-col md:flex-row overflow-hidden'>
            {/* Mobile Navigation */}
            <MobileNavigation />

            {/* Left Panel - Chat Section */}
            <section className={`left relative h-full md:h-screen md:min-w-96 md:w-1/3 bg-slate-300 flex flex-col ${mobileView !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
                <header className='flex justify-between items-end p-2 px-4 w-full bg-slate-100 sticky top-0 z-20'>
                    <button className='flex items-center gap-2 text-sm md:text-base' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill"></i>
                        <span>Add Collaborators</span>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 rounded-full hover:bg-slate-200'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                <div className="flex flex-col h-full">
                    <div ref={messageBoxRef} className="message-box flex-grow flex flex-col gap-1 p-1 px-2 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <MessageItem
                                key={index}
                                message={msg}
                                isOutgoing={msg.sender?._id === user?._id}
                            />
                        ))}
                    </div>

                    <div className="inputField w-full flex bg-white p-2 border-t border-slate-200">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && send()}
                            className='p-2 px-4 border border-slate-300 rounded-l-md outline-none flex-grow'
                            type="text"
                            placeholder='Enter Message'
                        />
                        <button
                            onClick={send}
                            className='px-4 py-2 bg-slate-950 text-white rounded-r-md hover:bg-slate-800 transition'
                        >
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                {/* Collaborators Side Panel */}
                <div className={`sidePanel w-full h-full bg-slate-50 flex flex-col fixed left-0 transition-all duration-300 z-30 ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <header className='flex justify-between items-center p-2 px-4 bg-slate-200'>
                        <h1 className='font-semibold text-lg'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(false)} className='p-2 hover:bg-slate-300 rounded-full'>
                            <i className="ri-close-line"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 overflow-y-auto p-2">
                        {project.users?.map((user, index) => (
                            <div key={index} className="user flex gap-2 items-center hover:bg-slate-200 p-3 rounded-md">
                                <div className='aspect-square rounded-full p-4 text-white bg-slate-500 w-fit h-fit flex items-center justify-center'>
                                    <i className="ri-user-2-fill"></i>
                                </div>
                                <h1 className='font-medium text-md truncate'>{user.email}</h1>
                            </div>
                        ))}
                        {(!project.users || project.users.length === 0) && (
                            <p className="text-slate-500 text-center p-4">No collaborators yet</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Right Panel - Code Editor & Preview */}
            <section className={`right bg-gray-600 flex-grow h-full flex flex-col md:flex-row ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                {/* File Explorer - Only visible in code view on mobile */}
                <div className={`explorer h-full w-full md:max-w-64 md:min-w-52 bg-slate-200 ${mobileView !== 'code' && mobileView !== 'chat' ? 'hidden md:block' : 'block'}`}>
                    <div className="file-header p-2 bg-slate-300 border-b border-slate-400">
                        <h2 className="font-semibold">Files</h2>
                    </div>
                    <div className="file-tree w-full">
                        {fileTree && typeof fileTree === 'object' && Object.keys(fileTree).length > 0 ? (
                            Object.keys(fileTree).map((file) => (
                                <button 
                                    key={file} 
                                    onClick={() => {
                                        setCurrentFile(file);
                                        setOpenFiles([...new Set([...openFiles, file])]);
                                    }} 
                                    className={`tree-element p-2 px-4 flex items-center gap-2 hover:bg-slate-300 w-full cursor-pointer text-left border-b border-slate-300 ${currentFile === file ? 'bg-slate-400 text-white' : ''}`}
                                >
                                    <i className="ri-file-code-line"></i>
                                    <p className='font-medium text-sm truncate'>{file}</p>
                                </button>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center p-4 text-sm">No files available</p>
                        )}
                    </div>
                </div>

                {/* Code Editor - Only visible in code view on mobile */}
                <div className={`code-editor flex flex-col h-full flex-grow ${mobileView !== 'code' && mobileView !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
                    <div className='top flex flex-wrap bg-slate-700 border-b border-slate-600'>
                        <div className='files flex overflow-x-auto'>
                            {openFiles.map((file) => (
                                <button
                                    key={file}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 flex items-center gap-2 border-r border-slate-600 ${currentFile === file ? 'bg-slate-500 text-white' : 'bg-slate-700 text-slate-200'}`}
                                >
                                    <i className="ri-file-code-line"></i>
                                    <p className='font-medium text-sm'>{file}</p>
                                </button>
                            ))}
                        </div>

                        <div className='actions flex gap-2 ml-auto p-1'>
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)


                                    const installProcess = await webContainer.spawn("npm", [ "install" ])



                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url)
                                        setIframeUrl(url)
                                    })

                                }}
                                className='p-2 px-4 bg-slate-300 text-white'
                            >
                                run
                            </button>
                        </div>
                    </div>

                    <div className='bottom flex flex-grow overflow-hidden'>
                        {fileTree && currentFile && fileTree[currentFile] ? (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-900 text-white">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                }
                                            };
                                            setFileTree(ft);
                                            saveFileTree(ft);
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: fileTree[currentFile]?.file?.contents 
                                                ? hljs.highlight(
                                                    currentFile.endsWith('.js') || currentFile.endsWith('.jsx') 
                                                        ? 'javascript' 
                                                        : 'plaintext', 
                                                    fileTree[currentFile].file.contents
                                                  ).value 
                                                : ''
                                        }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            padding: '1rem',
                                        }}
                                    />
                                </pre>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-slate-800 text-slate-400">
                                <div className="text-center p-4">
                                    <i className="ri-file-code-line text-4xl mb-2"></i>
                                    <p>Select a file to edit or create a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Window - Only visible in preview view on mobile */}
                {iframeUrl && webContainer && (
                    <div className={`flex flex-col h-full md:min-w-96 md:w-1/3 ${mobileView !== 'preview' ? 'hidden md:flex' : 'flex'}`}>
                        <div className="address-bar flex bg-slate-200 border-b border-slate-300">
                            <input 
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} 
                                className="w-full p-2 px-4 bg-slate-100 outline-none border-none" 
                            />
                            <button 
                                onClick={() => {
                                    // Refresh iframe by resetting and reassigning URL
                                    const currentUrl = iframeUrl;
                                    setIframeUrl(null);
                                    setTimeout(() => setIframeUrl(currentUrl), 100);
                                }}
                                className="p-2 px-4 bg-slate-300 hover:bg-slate-400"
                            >
                                <i className="ri-refresh-line"></i>
                            </button>
                        </div>
                        <div className="flex-grow relative">
                            <iframe 
                                src={iframeUrl} 
                                className="absolute inset-0 w-full h-full border-none"
                                title="Application Preview"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                            ></iframe>
                        </div>
                    </div>
                )}
            </section>

            {/* Collaborators Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative overflow-hidden">
                        <header className='flex justify-between items-center p-4 border-b border-slate-200'>
                            <h2 className='text-xl font-semibold'>Add Collaborators</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className='p-2 rounded-full hover:bg-slate-100'
                            >
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 max-h-96 overflow-auto p-4">
                            {users.length > 0 ? (
                                users.map((user, index) => (
                                    <div
                                        key={index}
                                        className={`cursor-pointer rounded-md hover:bg-slate-100 ${selectedUserId.has(user._id) ? 'bg-slate-200' : ''} p-3 flex gap-3 items-center`}
                                        onClick={() => handleUserClick(user._id)}
                                    >
                                        <div className='aspect-square rounded-full p-3 text-white bg-slate-600 flex items-center justify-center'>
                                            <i className="ri-user-fill"></i>
                                        </div>
                                        <h1 className='font-medium truncate'>{user.email}</h1>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-4">No users available</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 mr-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCollaborators}
                                disabled={selectedUserId.size === 0}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                                    selectedUserId.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                                }`}
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;







