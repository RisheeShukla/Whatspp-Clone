import {create} from 'zustand'
import {persist} from 'zustand/middleware'


const useThemeStore=create(
    persist(
        (set)=>(
            {
                
                theme:'light',
                setTheme:(theme)=>set({theme:theme}),
                
            }
        ),
        {
            name:'theme-store',
           getStorage:()=>localStorage
        }
    )
)

export default useThemeStore;