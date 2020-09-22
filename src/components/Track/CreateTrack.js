import React, {useState} from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import LibraryMusicIcon from "@material-ui/icons/LibraryMusic";
import { Mutation } from 'react-apollo';
import { gql } from 'apollo-boost';
import Error from '../Shared/Error';
import Loading from '../Shared/Loading';
import axios from 'axios';
import { GET_TRACK_QUERY } from '../../pages/App';
const CreateTrack = ({ classes }) => {
const [open, setOpen] = useState(false)
const [title, setTitle] = useState('')
const [description, setDescription] = useState('')
const [file, setFile] = useState('')
const [submitting, setSubmitting] = useState(false)
const [fileError, setFileError] = useState('');

const handleUpdateCache = (cache, {data: {createTrack}}) => {
    const data = cache.readQuery({ query: GET_TRACK_QUERY })
    const tracks = data.tracks.concat(createTrack.track)
    cache.writeQuery({ query: GET_TRACK_QUERY, data: {tracks} })
}

const handleAudioChange = event => {
    const selectedFile = event.target.files[0];
    const fileSizeLimit = 10000000;
    if (selectedFile && selectedFile.size > fileSizeLimit) {
        setFileError(`${selectedFile.name}: File size is too large`);
    } else {
        setFile(selectedFile);
        setFileError('');
    }

}

const handleAudioUpload = async () => {
    try {
        const data = new FormData();
        data.append('file', file);
        data.append('resource_type', 'raw');
        data.append('upload_preset', 'react-tracks');
        data.append('cloud_name', 'ctsfares');
        const res = await axios.post('https://api.cloudinary.com/v1_1/codeartistry/raw/upload', data);
        return res.data.url
    } catch(err) {
        console.error('Error uploading file', err)
        setSubmitting(false)
    }

}

const handleSubmit = async (event, createTrack) => {
    event.preventDefault();
    setSubmitting(true)
    //Upload our audio file, get returned url from API
    const uploadUrl =  await handleAudioUpload()
    console.log(uploadUrl)
    createTrack({variables: {title, description, url: uploadUrl }})
}
  return (
  <>
      <Button variant="fab" onClick={() => setOpen(true)} className={classes.fab} color="secondary">
          {
              open ? <ClearIcon/> : <AddIcon/>
          }
      </Button>
      {/* create track dialog */}
      <Mutation mutation={CREATE_TRACK_MUTATION}
          onCompleted = {data => {
              console.log({data});
              setOpen(false);
              setSubmitting(false);
              setTitle('');
              setDescription('');
              setFile('');
          }}
          refetchQueries = {()=>[{query: GET_TRACK_QUERY}]}
      >
        {
            (createTrack, {loading, error}) => {
            if (error) return <Error error={error}/>
            if (loading) return <Loading/>

            return (
                <Dialog open={open} className={classes.dialog}>
                      <form onSubmit={event => handleSubmit(event, createTrack)}>
                          <DialogTitle>Create track</DialogTitle>
                          <DialogContent>
                              <DialogContentText>
                                  Add a Title , Description & Audio File
                              </DialogContentText>
                              <FormControl fullWidth>
                                  <TextField label='Title' value={title} onChange={event => setTitle(event.target.value)} placeholder='Add Title' className={classes.textField} />
                              </FormControl>
                              <FormControl fullWidth>
                                  <TextField multiline rows='2' value={description} label='Description' onChange={event => setDescription(event.target.value)} placeholder='Add Description' className={classes.textField} />
                              </FormControl>
                              <FormControl error={Boolean(fileError)}>
                                  <input
                                    id='audio'
                                    required
                                    type='file'
                                    accept='audio/mp3,audio/wav'
                                    className={classes.input}
                                    onChange={handleAudioChange}
                                  />
                                  <label htmlFor='audio'>
                                      <Button variant='outline' color={file ? 'secondary' : 'inherit'} component='span' className={classes.button  }>
                                          Audio File
                                          <LibraryMusicIcon className={classes.icon}/>
                                      </Button>
                                      {file && file.name}
                                      <FormHelperText>{fileError}</FormHelperText>
                                  </label>
                              </FormControl>
                          </DialogContent>
                          <DialogActions>
                              <Button disabled={submitting} onClick={() => setOpen(false)} className={classes.cancel}>Cancel</Button>
                              <Button  type='submit' className={classes.save} disabled= {
                                          submitting || !title.trim() || !description.trim() || !file
                                      } >
                                        {
                                            submitting ? (<CircularProgress className={classes.save} size={24}/>) :  ("Add Track")
                                        }

                                      </Button>
                          </DialogActions>
                      </form>
                  </Dialog>
                )
            }
        }
      </Mutation>
  </>
  );
};

const CREATE_TRACK_MUTATION = gql`
    mutation ($title: String!, $description: String!, $url: String!) {
        createTrack(title: $title, description: $description, url: $url) {
            track {
                id
                title
                description
                url
                likes {
                  id
                }
                postedBy {
                    id
                    username
                }
            }
        }
    }
`

const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  dialog: {
    margin: "0 auto",
    maxWidth: 550
  },
  textField: {
    margin: theme.spacing.unit
  },
  cancel: {
    color: "red"
  },
  save: {
    color: "green"
  },
  button: {
    margin: theme.spacing.unit * 2
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
  input: {
    display: "none"
  },
  fab: {
    position: "fixed",
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
    zIndex: "200"
  }
});

export default withStyles(styles)(CreateTrack);
