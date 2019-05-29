
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


export const getProfile = async ()=>{
  if (profile) {
    return {profile:{...profile}, errors:[]}
  }
  try{
    const headers= getHeaders();
    const response =  await fetch(`${ACCOUNT_API}/api/profile`, { headers})

    if (response.status===401) {
      return {profile: null, errors: ['Not loggedin.']}
    }

    if (response.status===403) {
      return {profile: null, errors: ['Not Authorized.']}
    }

    if (response.status>=400) {
      return {profile: null, errors: ['Unable to retrive profile.']}
    }

    const p = await response.json();

    profile={...p};
    setTimeout(()=>{
      profile=null;
    },1800);
    return {profile:{...p}, errors: []}
  } catch (err) {
    return {profile: null, errors: ['Unable to retrive profile']}
  }
}
