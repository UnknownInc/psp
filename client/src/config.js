
export const ACCOUNT_API = ``
export const QUESTIONS_API = ``
export const USER_API = ``
export const TEAM_API = ``

let profile=null;

export const getHeaders = function() {
    const headers={}
    const token = `Bearer ${window.localStorage.getItem('m360t')}`;
    if (token) {
        headers['Authorization'] = token;
    }
    return headers
}


export const getProfile = async (ignoreCache)=>{
  if (profile && !ignoreCache) {
    return {profile:{...profile}, errors:[]}
  }
  try{
    const headers= getHeaders();
    const response =  await fetch(`/api/user/current`, { headers})

    if (response.status===401) {
      if (window.interop) { 
        window.interop.sendMessage('NotLoggedIn:401')
      }
      return {profile: null, errors: ['Not loggedin.']}
    }

    if (response.status===403) {
      if (window.interop) { 
        window.interop.sendMessage('NotLoggedIn:403')
      }
      return {profile: null, errors: ['Not Authorized.']}
    }

    if (response.status>=400) {
      if (window.interop) { 
        window.interop.sendMessage('NotLoggedIn:'+response.status)
      }
      return {profile: null, errors: ['Unable to retrive loggedin user details.']}
    }

    const p = await response.json();

    profile={...p};
    setTimeout(()=>{
      profile=null;
    },65200);
    return {profile:{...p}, errors: []}
  } catch (err) {
    return {profile: null, errors: ['Unable to retrive loggedin user details.']}
  }
}
