import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import useSWR, { useSWRConfig } from 'swr';
import classes from './index.module.css';
import type { TodoItem } from '@/utils/types';

const maxTodoListItems = 10;

const App = () => {
  const [todoItemText, setTodoItemText] = useState(''); // text of the new to-do item [controlled component
  const [searchText, setSearchText] = useState('');

  const { mutate } = useSWRConfig()

  const completeKey = `/api/search?completed=true&size=${maxTodoListItems}${searchText ? `&search=${searchText}` : ""}`;
  const incompleteKey = `/api/search?completed=false${searchText ? `&search=${searchText}` : ""}`;

  const fetchResults = (url: string): Promise<TodoItem[]> => {
    return fetch(url)
    .then((res) =>  {
      // Handle HTTP errors
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return res.json()
    })
    .then((data: TodoItem[]) => {
      if (!data) {
        return [];
      }
      // sort by text field
      const sorted = data.sort((a, b) => {
        const textA = a?.text?.toUpperCase();
        const textB = b?.text?.toUpperCase();
        if (textA < textB) {
          return -1;
        }
        if (textA > textB) {
          return 1;
        }
        return 0;
      });
      return sorted;
    });
  }

  // refresh every 60 seconds automatically
  const fetcherOptions = {
    refreshInterval: 1000*60,
  }
  const { data: incompleteResults = [] } = useSWR(incompleteKey, fetchResults, fetcherOptions)

  const { data: completeResults = []} = useSWR(completeKey, fetchResults, fetcherOptions)

  const handleAddTodoItem = async () => {
    try {
      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: todoItemText,
          completed: false,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      mutate(incompleteKey);
      mutate(completeKey);
      setTodoItemText('');
    } catch (error) {
      console.error(error);
      // Handle the error, such as displaying an error message to the user or retrying the request
    }
  };
  const handleSearchTextChange = (event: any) => {
    setSearchText(event.target.value);
  };

  const handleCheckboxChange = async (event: any, id: number) => {
    try {
      const { checked } = event.target;
      const response = await fetch(`/api/todo?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: checked }),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      mutate(incompleteKey);
      mutate(completeKey);
    } catch (error) {
      console.error(error);
      // Handle the error, such as displaying an error message to the user or retrying the request
    }
  };

  const handleDeleteAllTasksClick = async () => {
    try {
      const response = await fetch('/api/todo', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete tasks');
      }
      mutate(incompleteKey);
      mutate(completeKey);
    } catch (error) {
      console.error(error);
      // Handle the error, such as displaying an error message to the user or retrying the request
    }
  };

  return (
    <>
    <div className={classes.root}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" className={classes.appBar}>
          <Toolbar className={classes.toolbar}>
            <Typography variant="h6" className={classes.title} sx={{ mr: 2 }}>
              Todo List
            </Typography>
            <Typography variant="h6" color="inherit" component="div">
              <div className={classes.deleteButton} onClick={handleDeleteAllTasksClick}>
                <DeleteIcon /> Delete all tasks
              </div>
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <br />
      <br />
      <div className={classes.mainWrapper}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <div className={classes.form}>
                <TextField
                  label="Add new task"
                  variant="outlined"
                  fullWidth
                  required
                  value={todoItemText}
                  onChange={(event) => setTodoItemText(event.target.value)}
                />
              </div>
              </Paper>
              <br />
              <Button type="button" variant="contained" color="primary" disabled={todoItemText === ""} onClick={() => {
                handleAddTodoItem();
              }}>
                  Add
              </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <TextField
                label="Search tasks"
                variant="outlined"
                fullWidth
                className={classes.search}
                value={searchText}
                onChange={handleSearchTextChange}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <h2>Todo Items</h2>
            {incompleteResults?.map((item) => (
                <div key={item.id} className='todo-item'>
                  <FormControlLabel
                    control={<Checkbox checked={item.completed} onChange={(event) => handleCheckboxChange(event, item.id)} name="checked" />}
                    label={item.text}
                    className={classes.checkbox}
                  />
                  {/* <div>
                    <p>Upvotes: {item.upvoteCount}</p>
                    <p>Downvotes: {item.downvoteCount}</p>
                  </div> */}
                </div>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
          <h2>Finished Items</h2>
          {completeResults?.map((item) => (
              <div key={item.id} className='finished-item'>
                <FormControlLabel
                  control={<Checkbox checked={item.completed} name="checked" onChange={(event) => handleCheckboxChange(event, item.id)}  />}
                  label={item.text}
                  className={classes.checkbox}
                />
              </div>
            ))}
          </Grid>
        </Grid>
      </div>
    </div>
    </>
  );
};

export default App;