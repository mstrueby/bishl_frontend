import Sidebar from '../Sidebar'

const navigation = [
    { name: 'Dashboard', icon: 'RectangleGroupIcon', href: '/leaguemanager', current: false },
    { name: 'Vereine', icon: 'BookmarkIcon', href: '/leaguemanager/clubs', current: false },
    { name: 'Mannschaften', icon: 'UserGroupIcon', href: '/leaguemanager/teams', current: false },
    { name: 'Spieler', icon: 'UserIcon', href: '/', current: false },
    { name: 'Spielstätten', icon: 'RectangleStackIcon', href: '/leaguemanager/venues', current: false },
    { name: 'Wettbewerbe', icon: 'TrophyIcon', href: '/', current: false },
    { name: 'Saisons', icon: 'CalendarIcon', href: '/', current: false },
    { name: 'Spieltage', icon: 'CalendarDaysIcon', href: '/', current: false },
    { name: 'Spiele', icon: 'QueueListIcon', href: '/', current: false },
]

const LmSidebar = () => {
    return (
        <Sidebar NavData={navigation} />
    )
}

export default LmSidebar