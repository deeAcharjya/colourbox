import { extendTheme } from "native-base";

////icons are at https://materialdesignicons.com/

//colors are at https://docs.nativebase.io/next/default-theme

const theme = extendTheme({
    useSystemColorMode: false,
    initialColorMode: "dark",
    components: {

        /*
        Button: {
            // Can simply pass default props to change default behaviour of components.
            baseStyle: {
                rounded: 'md',
            },
            defaultProps: {
                colorScheme: 'red',
            },
        },
        */
        VStack:{
            baseStyle: ({ colorMode }:{colorMode:any}) => {
                return {
                    color: colorMode === 'dark' ? 'blueGray.900' : 'blueGray.900',
          
                };
            },
        },
        Heading: {
            // Can pass also function, giving you access theming tools
            baseStyle: ({ colorMode }) => {
                return {
                    color: colorMode === 'dark' ? 'warmGray.100' : 'warmGray.700',
                    fontWeight: 'normal',
                };
            },
        },
        Text: {
            // Can pass also function, giving you access theming tools
            baseStyle: ({ colorMode }) => {
                return {
                    color: colorMode === 'dark' ? 'blue.100' : 'warmGray.700',
                };
            },
        },
        /* DOn't do this Theme it messes up button and all 
        Box:{
            baseStyle: ({ colorMode }:{colorMode:string}) => {
                return {
                    backgroundColor: colorMode === 'dark' ? 'light.900' : 'light.50',
                };
            },
        }
        */

    },
});


export default theme;