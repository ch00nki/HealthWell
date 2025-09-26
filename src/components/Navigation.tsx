'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Menu as MenuIcon, Home, Person, FitnessCenter, Restaurant, Message } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import Marquee from 'react-fast-marquee';

const drawerWidth = 240;

const navItems = [
  { name: 'Home', icon: <Home />, path: '/' },
  { name: 'Profile', icon: <Person />, path: '/profile' },
  { name: 'Activity Log', icon: <FitnessCenter />, path: '/activity' },
  { name: 'Meal Log', icon: <Restaurant />, path: '/meals' },
  { name: 'Health Check', icon: <Message />, path: '/health' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, logOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  //floating Name
  const [name, setName] = useState('User');
  // const [loading, setLoading] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
    await logOut();
    router.push('/auth/login');
    setLogoutDialogOpen(false);
    } 
    catch (error) {
    console.error('Logout failed:', error);
    }
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Prevent scrolling at the container level
    }}>
      <Toolbar disableGutters sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        minHeight: '64px !important', // Force consistent height
        px:1
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ ml:0,
              cursor: 'pointer',
              color: 'primary.main',
              fontWeight: 'bold',
              '&:hover': {
                color: 'primary.light'
              }
            }}
          >
            HealthWell ദ്ദി(˵ •̀ ᴗ - ˵)✧
          </Typography>
        </Link>
      </Toolbar>
      <List sx={{ 
        flex: 1,
        py: 1,
        px: 1,
        overflowY: 'auto', // Only allow scrolling if needed
        '&::-webkit-scrollbar': {
          display: 'none' // Hide scrollbar for cleaner look
        }
      }}>
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ListItem 
              sx={{
                mb: 0.5,
                borderRadius: 1,
                backgroundColor: pathname === item.path ? 'primary.main' : 'transparent',
                color: pathname === item.path ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: pathname === item.path ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: pathname === item.path ? 'white' : 'primary.main',
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          </Link>
        ))}
      </List>
    </Box>
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || 'User');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }, 
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* Toolbar is a flexbox by default */}
        <Toolbar>

          <IconButton
            color="primary"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {/* <Box sx={{overflow:'hidden', whiteSpace: 'nowrap', flexGrow: 1}}>
            <Typography variant='h5' color="primary"
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                display: 'inline-block',
                animation: 'marquee 5s linear infinite',
                '@keyframes marquee': {
                  '0%': { transform: 'translateX(100%)' },
                  '100%': { transform: 'translateX(-100%)' },
                },
              }}>
                Hello {name}! 👋 Welcome back!
                </Typography>
          </Box> */}
          {pathname === '/' ? 
          // Marquee is rendering an internal container with display block/flex
          // and width: 100% by default
          <Marquee speed={150}>
            <Typography variant='h5' color='primary' sx={{fontWeight: 'bold',}}>
              Hello {name}! 👋 Welcome back!
            </Typography>
          </Marquee>
          : <Box flexGrow={1}></Box>
          }
          {user ? (
            <>
              <IconButton
                color="primary"
                onClick={toggleTheme}
                sx={{ mr: 1 }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <Button 
                color="primary" 
                variant="outlined"
                onClick={() => setLogoutDialogOpen(true)}
                sx={{borderWidth: 1.4,
                    '&:hover': {
                    backgroundColor: 'primary.main',
                    color: '#fff',              // Text becomes white
                    }, }}
              >
                Logout
              </Button>
              <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
              >
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to log out?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setLogoutDialogOpen(false)} color="primary" 
                    sx={{
                        '&:hover': {
                        backgroundColor: 'primary.main',
                        color: '#fff',              // Text becomes white
                        }, }}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogout} color="primary"
                    sx={{
                        '&:hover': {
                        backgroundColor: 'primary.main',
                        color: '#fff',              // Text becomes white
                        }, }}>
                    Logout
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          ) : (
            <Link href="/auth/login" passHref style={{ textDecoration: 'none' }}>
              <Button color="primary" variant="contained">
                Login
              </Button>
            </Link>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
}
