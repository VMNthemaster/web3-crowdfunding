import React, { createContext, useContext } from 'react'

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
} from '@thirdweb-dev/react'
import { ethers } from 'ethers'

const StateContext = createContext()

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract('0x528497dA4f2e602AeDf9a9a29FB85A9a8105F19F')

  // renaming mutateAsync to a good variable
  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    'createCampaign'
  )

  // address of smart wallet
  const address = useAddress()

  const connect = useMetamask()

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign([
        address, // owner
        form.title, // title
        form.description, // description
        form.target,
        new Date(form.deadline).getTime(), // deadline,
        form.image
      ])

      console.log("contract call success", data)
    } catch (error) {
      console.log("contract call failure", error)
    }
  }

  // since this is a get method and not a write we dont have to use the useContractWrite method
  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns')

    const parsedCampaigns = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      pId: i,
    }))

    return parsedCampaigns
  }

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns()
    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    )
    return filteredCampaigns
  }

  const donate = async (pId, amount) => {
    // const data = await contract.call('donateToCampaign', pId)
    const data = await contract.call('donateToCampaign', pId, {value: ethers.utils.parseEther(amount)})
    return data
  }

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', pId)

    const numberOfDonations = donations[0].length

    const parsedDonations = []

    for (let i = 0; i < numberOfDonations.length; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      })
    }

    return parsedDonations;
  }

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext)
