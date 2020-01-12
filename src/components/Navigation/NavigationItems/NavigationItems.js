import React from 'react';

import classes from './NavigationItems.css';
import NavigationItem from './NavigationItem/NavigationItem';

const navigationItems = () => (
    <ul className={classes.NavigationItems}>
        <NavigationItem link="/" exact>Home</NavigationItem>
        <NavigationItem link="/exercise" exact>Exercise</NavigationItem>
        <NavigationItem link="/workout" exact>Workout</NavigationItem>
    </ul>
);

export default navigationItems;