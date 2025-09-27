import React from 'react'
import OrderField from './OrderField'
import { t, TRANSLATION } from '../../../localization'
import { IFurniture, IOrder, IRoom, TRoomFurniture } from '../../../types/types'
import images from '../../../constants/images'
import furniture, { IFurnitureItem } from '../../../constants/furniture'
import { EMoveTypes } from '../../passenger-order/move/MoveTypeTabs'
import rooms from '../../../constants/rooms'

interface IProps {
  order: IOrder
}

interface IFurnitureDisplayItem {
  furniture: IFurnitureItem
  value: number
}

const renderFurnitureItem = (item: IFurnitureDisplayItem, index: number) => {
  return (
    <span key={item.furniture.id}>
      {index !== 0 && ', '}
      <img src={item.furniture.image} alt={t(item.furniture.label)} />
      {t(item.furniture.label, { toLower: true })}({item.value})
    </span>
  )
}

const getFurnitureItems = (furnitureData: Record<string, number>): IFurnitureDisplayItem[] => {
  return Object.entries(furnitureData)
    .filter(([_, value]) => !!value)
    .map(([key, value]) => {
      const foundFurniture = furniture.find(i => i.id === +key) as IFurnitureItem
      return { furniture: foundFurniture, value }
    })
}

const RoomFurnitureDisplay: React.FC<{
  roomID: string
  room: TRoomFurniture
  elevator?: { steps: Record<string, number> }
}> = ({ roomID, room, elevator }) => {
  const foundRoom = rooms.find(r => r.id === +roomID) as IRoom
  const furnitureItems = getFurnitureItems(room)

  return (
    <OrderField
      image={images.furniture}
      alt={t(foundRoom.label)}
      title={t(foundRoom.label)}
      value={
        <>
          {elevator?.steps[roomID] &&
            `${elevator.steps[roomID]} ${t(TRANSLATION.STEPS)}, `
          }
          {furnitureItems.map((item, index) => renderFurnitureItem(item, index))}
        </>
      }
    />
  )
}

const SimpleFurnitureDisplay: React.FC<{
  furniture: Record<string, number>
}> = ({ furniture: furnitureData }) => {
  const furnitureItems = getFurnitureItems(furnitureData)

  return (
    <OrderField
      image={images.furniture}
      alt={t(TRANSLATION.FURNITURE_LIST)}
      title={t(TRANSLATION.FURNITURE_LIST)}
      value={furnitureItems.map((item, index) => renderFurnitureItem(item, index))}
    />
  )
}

const Rooms: React.FC<IProps> = ({ order }) => {
  if (!order.b_options?.furniture) {
    return null
  }

  const isApartmentMove = order.b_options.moveType === EMoveTypes.Apartament

  return (
    <div className="order-info__furniture">
      {isApartmentMove ? (
        Object.entries<TRoomFurniture>(order.b_options.furniture as IFurniture['house'])
          .map(([roomID, room]) => (
            <RoomFurnitureDisplay
              key={roomID}
              roomID={roomID}
              room={room}
              elevator={order.b_options?.elevator}
            />
          ))
      ) : (
        <SimpleFurnitureDisplay furniture={order.b_options.furniture as Record<string, number>} />
      )}
    </div>
  )
}

export default Rooms